import * as fs from 'fs';
import * as path from 'path';
import * as R from 'ramda';
import * as vscode from 'vscode';
import * as https from 'https';

import { CloneSkillTemplate } from './cloneSkillTemplate';
import { SmapiResource, SmapiClientFactory, Utils } from '../../runtime';
import { SkillInfo } from '../../models/types';
import { GitInTerminalHelper, getOrInstantiateGitApi, isGitInstalled } from '../gitHelper';
import { createSkillPackageFolder, syncSkillPackage } from '../skillPackageHelper';
import { checkAuthInfoScript, checkAskPrePushScript, checkGitCredentialHelperScript } from '../s3ScriptChecker'
import { SKILL_FOLDER, DEFAULT_PROFILE, SKILL, GIT_MESSAGES, CLI_HOSTED_SKILL_TYPE } from '../../constants';
import { Logger } from '../../logger';
import { loggableAskError, AskError } from '../../exceptions';

export class CloneHostedSkill extends CloneSkillTemplate {

    async setupGitFolder(
        skillInfo: SmapiResource<SkillInfo>, targetPath: string, context: vscode.ExtensionContext): Promise<void> {
        Logger.verbose(`Calling method: setupGitFolder, args: `, skillInfo, targetPath);
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
            await this.downloadGitCredentialScript(targetPath, context);
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
            await this.setPrePushHookScript(targetPath, context);
        } catch (err) {
            throw loggableAskError(`Git folder setup failed for ${targetPath}`, err);
        }
    }

    createAskResourcesConfig(
        projectPath: string, profile: string, skillId: string): void {

        super.createAskResourcesConfig(projectPath, profile, skillId);
        const askResourcesPath = path.join(projectPath, SKILL_FOLDER.ASK_RESOURCES_JSON_CONFIG);
        let askResourcesJson = R.clone(JSON.parse(fs.readFileSync(askResourcesPath, 'utf-8')));
        askResourcesJson = R.set(
            R.lensPath(['profiles', profile, 'skillInfrastructure', 'type']), CLI_HOSTED_SKILL_TYPE, askResourcesJson);
        fs.writeFileSync(askResourcesPath, JSON.stringify(askResourcesJson, null, 2));
    }

    downloadScriptFile(
        scriptUrl: string, filePath: string, chmod: string): Promise<void>{
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

    async setPrePushHookScript(
        projectPath: string, context: vscode.ExtensionContext): Promise<void> {
        Logger.verbose(`Calling method: setPrePushHookScript, args: `, projectPath);
        
        await checkAuthInfoScript(context);
        await checkAskPrePushScript(context);
        const scriptUrl = SKILL.GIT_HOOKS_SCRIPTS.PRE_PUSH.URL;
        const scriptFilePath = path.join(
            projectPath, SKILL_FOLDER.HIDDEN_GIT_FOLDER.NAME, 
            SKILL_FOLDER.HIDDEN_GIT_FOLDER.HOOKS.NAME, SKILL_FOLDER.HIDDEN_GIT_FOLDER.HOOKS.PRE_PUSH);
        const chmod = SKILL.GIT_HOOKS_SCRIPTS.PRE_PUSH.CHMOD;
        await this.downloadScriptFile(scriptUrl, scriptFilePath, chmod);
    }

    async downloadGitCredentialScript(
        projectPath: string, context: vscode.ExtensionContext): Promise<void> {
        Logger.verbose(`Calling method: downloadGitCredentialScript, args: `, projectPath);
        
        await checkAuthInfoScript(context);
        await checkGitCredentialHelperScript(context);
    }

    checkGitInstallation(): void {
        Logger.verbose(`Calling method: checkGitInstallation`);
        if (!isGitInstalled()) {
            throw new AskError(GIT_MESSAGES.GIT_NOT_FOUND);
        }
    }

    filesToIgnore(): string[] {
        const nodeModules = `${SKILL_FOLDER.LAMBDA.NAME}/${SKILL_FOLDER.LAMBDA.NODE_MODULES}`;
        return [SKILL_FOLDER.ASK_RESOURCES_JSON_CONFIG, SKILL_FOLDER.HIDDEN_ASK_FOLDER, SKILL_FOLDER.HIDDEN_VSCODE ,nodeModules];
    }

    async cloneSkill(
        skillInfo: SmapiResource<SkillInfo>, targetPath: string, context: vscode.ExtensionContext, 
        progressBar?: vscode.Progress<{message: string; increment: number}>): Promise<void> {
        Logger.verbose(`Calling method: cloneSkill, args: `, skillInfo, progressBar);
        
        if (skillInfo.data.isHosted === false) {
            return;
        }
        this.checkGitInstallation();
        const incrAmount: number = !progressBar ? 0 : 25;
        
        fs.mkdirSync(path.join(targetPath, SKILL_FOLDER.HIDDEN_ASK_FOLDER));
        const profile = Utils.getCachedProfile(context) ?? DEFAULT_PROFILE;
        
        await this.setupGitFolder(skillInfo, targetPath, context);
        if (progressBar) {
            progressBar.report({
                increment: incrAmount,
                message: 'Git access set. Checking skill metadata files...'
            });
        }
    
        this.createAskResourcesConfig(
            targetPath, profile, skillInfo.data.skillSummary.skillId!);
        this.createAskStateConfig(
            targetPath, profile, skillInfo.data.skillSummary.skillId!);
        if (progressBar) {
            progressBar.report({
                increment: incrAmount,
                message: 'Skill metadata files checked. Checking skill package...'
            });
        }
    
        GitInTerminalHelper.addFilesToIgnore(targetPath, this.filesToIgnore());
    
        createSkillPackageFolder(targetPath);
        if (progressBar) {
            progressBar.report({
                increment: incrAmount,
                message: 'Skill package created. Syncing from service...'
            });
        }
    
        const skillPkgPath = path.join(targetPath, SKILL_FOLDER.SKILL_PACKAGE.NAME);
        await syncSkillPackage(skillPkgPath, skillInfo, context);
        if (progressBar) {
            progressBar.report({
                increment: incrAmount,
                message: "Skill package sync'd."
            });
        }
    }
}