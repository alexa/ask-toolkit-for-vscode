import * as vscode from 'vscode';
import * as path from 'path';
import { 
    SmapiResource, SmapiClientFactory, Utils
} from '../runtime';
import * as R from 'ramda';
import * as fs from 'fs';
import * as fsExtra from 'fs-extra';
import * as https from 'https';

import { CommandContext } from '../runtime';
import { SkillInfo } from '../models/types';
import { GitInTerminalHelper, getOrInstantiateGitApi, isGitInstalled } from './gitHelper';
import { createSkillPackageFolder, syncSkillPackage } from './skillPackageHelper';
import { checkAuthInfoScript, checkAskPrePushScript, checkGitCredentialHelperScript } from './s3ScriptChecker'
import { SKILL_FOLDER, BASE_RESOURCES_CONFIG, DEFAULT_PROFILE, 
    BASE_STATES_CONFIG, SKILL, GIT_MESSAGES, CLI_HOSTED_SKILL_TYPE } from '../constants';
import { Logger } from '../logger';
import { loggableAskError, AskError } from '../exceptions';
import { getSkillNameFromLocales } from '../utils/skillHelper';
import { openWorkspaceFolder } from '../utils/workspaceHelper';

export async function executeClone(context: CommandContext, skillInfo: SmapiResource<SkillInfo>) {
    try {
        const skillFolderUri = await createSkillFolder(skillInfo);
        if (skillFolderUri === undefined) {
            return;
        }
        // Create progress bar and run next steps
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Downloading skill",
            cancellable: false
        }, async (progress, token) => {
            await cloneSkill(
                skillInfo, skillFolderUri.fsPath,
                context.extensionContext, progress);
        });
        const skillName = getSkillNameFromLocales(skillInfo.data.skillSummary.nameByLocale!);
        const cloneSkillMsg = `Skill ${skillName} was cloned successfully and added to workspace. The skill is located at ${skillFolderUri.fsPath}`;

        Logger.info(cloneSkillMsg);
        vscode.window.showInformationMessage(cloneSkillMsg);

        // Add skill folder to workspace
        await openWorkspaceFolder(skillFolderUri);
        return;
    } catch (err) {
        throw loggableAskError(`Skill clone failed`, err, true);
    }
}

async function createSkillFolder(skillInfo: SmapiResource<SkillInfo>): Promise<vscode.Uri | undefined> {
    Logger.verbose(`Calling method: createSkillFolder, args: `, skillInfo);
    const selectedFolderArray = await vscode.window.showOpenDialog(
        {
            openLabel: 'Select project folder',
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false
        }
    );
    if (selectedFolderArray === undefined) {
        return undefined;
    }

    const projectFolder = selectedFolderArray[0];
    const skillName = getSkillNameFromLocales(
        skillInfo.data.skillSummary.nameByLocale!);
    const filteredProjectName = Utils.filterNonAlphanumeric(skillName);
    const skillFolderAbsPath = path.join(projectFolder.fsPath, filteredProjectName);

    // create skill folder in project path
    if (fs.existsSync(skillFolderAbsPath)) {
        Logger.debug(`Skill folder ${skillFolderAbsPath} already exists.`);
        const errorMessage = `Skill folder ${skillFolderAbsPath} already exists. Would you like to overwrite it?`;
        const overWriteSelection = await vscode.window.showInformationMessage(errorMessage, ...['Yes', 'No']);
        if (overWriteSelection === 'Yes') {
            Logger.debug(`Confirmed skill folder overwrite option. Overwriting ${skillFolderAbsPath}.`);
            fsExtra.removeSync(skillFolderAbsPath);
        }
        else {
            return undefined;
        }
    }

    fs.mkdirSync(skillFolderAbsPath);

    return vscode.Uri.file(skillFolderAbsPath);
}

async function setupGitFolder(
    skillInfo: SmapiResource<SkillInfo>, targetPath: string, context: vscode.ExtensionContext): Promise<void> {
        
    try {
        Logger.verbose(`Calling method: setupGitFolder, args: `, skillInfo, targetPath);
        let profile = Utils.getCachedProfile(context);
        profile = profile ?? DEFAULT_PROFILE;
        const smapiClient = SmapiClientFactory.getInstance(profile, context);
        const skillId = skillInfo.data.skillSummary.skillId!;

        const credentialsList = await smapiClient.generateCredentialsForAlexaHostedSkillV1(
            skillId, 
            {
                repository: skillInfo.data.hostedSkillMetadata?.alexaHosted?.repository!
            }
        );
        const repositoryCredentials = credentialsList.repositoryCredentials;        
        if (!repositoryCredentials || !repositoryCredentials.username || !repositoryCredentials.password) {
            throw new Error("Failed to retrieve hosted skill credentials from the service.");
        }
        const gitHelper = new GitInTerminalHelper(targetPath, Logger.logLevel);
        const repoUrl = skillInfo.data.hostedSkillMetadata?.alexaHosted?.repository?.url;
        if (!repoUrl) {
            throw new Error("Failed to retrieve hosted skill repo URL from the service.");
        }
        await downloadGitCredentialScript(targetPath, context);
        gitHelper.init();
        gitHelper.configureCredentialHelper(repoUrl, profile, skillId);
        gitHelper.addOrigin(repoUrl);
        
        /**
         * Since gitHelper commands are failing due to execSync
         * not waiting to call next command, calling the following
         * set of git commands through inbuilt git extension
         */
        await vscode.commands.executeCommand('git.openRepository', targetPath);

        const gitApi = await getOrInstantiateGitApi(context);
        const repo = gitApi?.getRepository(vscode.Uri.file(targetPath));
        
        await repo?.fetch();
        await repo?.checkout('prod');
        await repo?.checkout('master');
        await setPrePushHookScript(targetPath, context);
    } catch (err) {
        throw loggableAskError(`Git folder setup failed for ${targetPath}`, err);
    }
}

function createAskResourcesConfig(
    projectPath: string, profile: string | undefined, skillId: string): void {
    Logger.verbose(`Calling method: createAskResourcesConfig, args: `, projectPath, profile, skillId);
    profile = profile ?? DEFAULT_PROFILE;
    const askResourcesPath = path.join(projectPath, SKILL_FOLDER.ASK_RESOURCES_JSON_CONFIG);

    let askResourcesJson = R.clone(BASE_RESOURCES_CONFIG);
    askResourcesJson = R.set(
        R.lensPath(['profiles', profile, 'skillId']), skillId, askResourcesJson);
    askResourcesJson = R.set(
        R.lensPath(['profiles', profile, 'skillInfrastructure', 'type']), CLI_HOSTED_SKILL_TYPE, askResourcesJson);
    fs.writeFileSync(askResourcesPath, JSON.stringify(askResourcesJson, null, 2));
}

function createAskStateConfig(
    projectPath: string, profile: string, skillId: string): void {
    Logger.verbose(`Calling method: createAskStateConfig, args: `, projectPath, profile, skillId);
    const askStatesPath = path.join(projectPath, SKILL_FOLDER.HIDDEN_ASK_FOLDER, SKILL_FOLDER.ASK_STATES_JSON_CONFIG);

    let askStatesJson = R.clone(BASE_STATES_CONFIG);
    askStatesJson = R.set(
        R.lensPath(['profiles', profile, 'skillId']), skillId, askStatesJson);
    fs.writeFileSync(askStatesPath, JSON.stringify(askStatesJson, null, 2));
}

function downloadScriptFile(
    scriptUrl: string, filePath:string, chmod: string): Promise<void>{
    Logger.verbose(`Calling method: downloadScriptFile, args: `, scriptUrl, filePath, chmod);
    const file = fs.createWriteStream(filePath);
    return new Promise((resolve, reject) => {
        const request = https.get(scriptUrl, (resp) => {
            resp.pipe(file);
            fs.chmodSync(filePath, chmod);
            resolve();
        });
        request.on('error', (err) => {
            reject(loggableAskError('Download script failed ', err));
        });
        request.end();
    });
}

async function setPrePushHookScript(
    projectPath: string, context: vscode.ExtensionContext): Promise<void> {
    Logger.verbose(`Calling method: setPrePushHookScript, args: `, projectPath);
    
    await checkAuthInfoScript(context);
    await checkAskPrePushScript(context);
    const scriptUrl = SKILL.GIT_HOOKS_SCRIPTS.PRE_PUSH.URL;
    const scriptFilePath = path.join(
        projectPath, SKILL_FOLDER.HIDDEN_GIT_FOLDER.NAME, 
        SKILL_FOLDER.HIDDEN_GIT_FOLDER.HOOKS.NAME, SKILL_FOLDER.HIDDEN_GIT_FOLDER.HOOKS.PRE_PUSH);
    const chmod = SKILL.GIT_HOOKS_SCRIPTS.PRE_PUSH.CHMOD;
    await downloadScriptFile(scriptUrl, scriptFilePath, chmod);
}

async function downloadGitCredentialScript(
    projectPath: string, context: vscode.ExtensionContext): Promise<void> {
    Logger.verbose(`Calling method: downloadGitCredentialScript, args: `, projectPath);
    
    await checkAuthInfoScript(context);
    await checkGitCredentialHelperScript(context);
}

function checkGitInstallation() {
    Logger.verbose(`Calling method: checkGitInstallation`);
    if (!isGitInstalled()) {
        throw new AskError(GIT_MESSAGES.GIT_NOT_FOUND);
    }
}

export async function cloneSkill(
    skillInfo: SmapiResource<SkillInfo>, targetPath: string, context: vscode.ExtensionContext, 
    progressBar?: vscode.Progress<{message: string; increment: number}>): Promise<void> {
    Logger.verbose(`Calling method: cloneSkill, args: `, skillInfo, targetPath);
    checkGitInstallation();
    const incrAmount: number = !progressBar ? 0 : 25;
    
    fs.mkdirSync(path.join(targetPath, SKILL_FOLDER.HIDDEN_ASK_FOLDER));
    const profile = Utils.getCachedProfile(context) ?? DEFAULT_PROFILE;
    
    if (skillInfo.data.isHosted) {
        await setupGitFolder(skillInfo, targetPath, context);
        if (progressBar) {
            progressBar.report({
                increment: incrAmount,
                message: 'Git access set. Checking skill metadata files...'
            });
        }
    }

    createAskResourcesConfig(
        targetPath, profile, skillInfo.data.skillSummary.skillId!);
    createAskStateConfig(
        targetPath, profile, skillInfo.data.skillSummary.skillId!);
    if (progressBar) {
        progressBar.report({
            increment: incrAmount,
            message: 'Skill metadata files checked. Checking skill package...'
        });
    }

    GitInTerminalHelper.addFilesToIgnore(targetPath, filesToIgnore());

    createSkillPackageFolder(targetPath);
    if (progressBar) {
        progressBar.report({
            increment: incrAmount,
            message: 'Skill package created. Syncing from service...'
        });
    }

    const skillPkgPath = path.join(targetPath, SKILL_FOLDER.SKILL_PACKAGE.NAME);
    await syncSkillPackage(skillPkgPath, skillInfo.data.skillSummary.skillId!, context, "development");
    if (progressBar) {
        progressBar.report({
            increment: incrAmount,
            message: "Skill package sync'd."
        });
    }
}

function filesToIgnore(): string[] {
    const nodeModules = `${SKILL_FOLDER.LAMBDA.NAME}/${SKILL_FOLDER.LAMBDA.NODE_MODULES}`;
    return [SKILL_FOLDER.ASK_RESOURCES_JSON_CONFIG, SKILL_FOLDER.HIDDEN_ASK_FOLDER, SKILL_FOLDER.HIDDEN_VSCODE ,nodeModules, '.DS_Store'];
}

