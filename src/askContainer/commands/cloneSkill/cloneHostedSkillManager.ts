import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as https from 'https';

import { AbstractCloneSkillManager } from './abstractCloneSkillManager';
import { SmapiClientFactory } from '../../../runtime';
import { GitInTerminalHelper, getOrInstantiateGitApi, isGitInstalled } from '../../../utils/gitHelper';
import { createSkillPackageFolder, syncSkillPackage } from '../../../utils/skillPackageHelper';
import {
    checkAuthInfoScript,
    checkAskPrePushScript,
    checkGitCredentialHelperScript,
} from '../../../utils/s3ScriptChecker';
import { BRANCH_TO_STAGE, SKILL_FOLDER, SKILL, GIT_MESSAGES } from '../../../constants';
import { Logger } from '../../../logger';
import { loggableAskError, AskError } from '../../../exceptions';
import { Repository } from '../../../@types/git';

export class CloneHostedSkillManager extends AbstractCloneSkillManager {
    async setupGitFolder(): Promise<Repository> {
        Logger.verbose(`Calling method: setupGitFolder`);
        try {
            const smapiClient = SmapiClientFactory.getInstance(this.profile, this.context);
            const skillId = this.skillInfo.data.skillSummary.skillId!;

            const credentialsList = await smapiClient.generateCredentialsForAlexaHostedSkillV1(skillId, {
                repository: this.skillInfo.data.hostedSkillMetadata!.alexaHosted!.repository!,
            });
            const repositoryCredentials = credentialsList.repositoryCredentials;
            if (
                repositoryCredentials === undefined ||
                repositoryCredentials.username === undefined ||
                repositoryCredentials.password === undefined
            ) {
                throw new AskError('Failed to retrieve hosted skill credentials from the service.');
            }
            const gitHelper = new GitInTerminalHelper(this.fsPath, Logger.logLevel);
            const repoUrl = this.skillInfo.data.hostedSkillMetadata?.alexaHosted?.repository?.url;
            if (repoUrl === undefined) {
                throw new AskError('Failed to retrieve hosted skill repo URL from the service.');
            }
            await this.downloadGitCredentialScript(this.fsPath, this.context);
            gitHelper.init();
            gitHelper.configureCredentialHelper(repoUrl, this.profile, skillId);
            gitHelper.addOrigin(repoUrl);

            /**
             * Since gitHelper commands are failing due to execSync
             * not waiting to call next command, calling the following
             * set of git commands through inbuilt git extension
             */
            await vscode.commands.executeCommand('git.openRepository', this.fsPath);

            const gitApi = await getOrInstantiateGitApi(this.context);
            const repo = gitApi?.getRepository(vscode.Uri.file(this.fsPath));

            if (repo === undefined || repo === null) {
                throw new AskError('No skill repository found.');
            }

            await repo.fetch();
            await repo.checkout('prod');
            await repo.checkout('master');
            await this.setPrePushHookScript(this.fsPath, this.context);
            return repo;
        } catch (err) {
            throw loggableAskError(`Git folder setup failed for ${this.fsPath}`, err);
        }
    }

    downloadScriptFile(scriptUrl: string, filePath: string, chmod: string): Promise<void> {
        Logger.verbose(`Calling method: downloadScriptFile, args: `, scriptUrl, filePath, chmod);
        const file = fs.createWriteStream(filePath);
        return new Promise((resolve, reject) => {
            const request = https.get(scriptUrl, resp => {
                resp.pipe(file);
                fs.chmodSync(filePath, chmod);
                resolve();
            });
            request.on('error', err => {
                reject(loggableAskError('Download script failed ', err));
            });
            request.end();
        });
    }

    async setPrePushHookScript(projectPath: string, context: vscode.ExtensionContext): Promise<void> {
        Logger.verbose(`Calling method: setPrePushHookScript, args: `, projectPath);

        await checkAuthInfoScript(context);
        await checkAskPrePushScript(context);
        const scriptUrl = SKILL.GIT_HOOKS_SCRIPTS.PRE_PUSH.URL;
        const scriptFilePath = path.join(
            projectPath,
            SKILL_FOLDER.HIDDEN_GIT_FOLDER.NAME,
            SKILL_FOLDER.HIDDEN_GIT_FOLDER.HOOKS.NAME,
            SKILL_FOLDER.HIDDEN_GIT_FOLDER.HOOKS.PRE_PUSH
        );
        const chmod = SKILL.GIT_HOOKS_SCRIPTS.PRE_PUSH.CHMOD;
        await this.downloadScriptFile(scriptUrl, scriptFilePath, chmod);
    }

    async downloadGitCredentialScript(projectPath: string, context: vscode.ExtensionContext): Promise<void> {
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
        Logger.verbose(`Calling method: filesToIgnore`);
        const nodeModules = `${SKILL_FOLDER.LAMBDA.NAME}/${SKILL_FOLDER.LAMBDA.NODE_MODULES}`;
        return [
            SKILL_FOLDER.ASK_RESOURCES_JSON_CONFIG,
            SKILL_FOLDER.HIDDEN_ASK_FOLDER,
            SKILL_FOLDER.HIDDEN_VSCODE,
            nodeModules,
        ];
    }

    async cloneSkill(progressBar: vscode.Progress<{ message: string; increment: number }>, incrAmount?: number): Promise<void> {
        Logger.verbose(`Calling method: cloneSkill, args: `, progressBar);

        this.checkGitInstallation();
        incrAmount = incrAmount ?? 25;

        fs.mkdirSync(path.join(this.fsPath, SKILL_FOLDER.HIDDEN_ASK_FOLDER));

        const skillRepo = await this.setupGitFolder();
        progressBar.report({
            increment: incrAmount,
            message: 'Git access set. Checking skill metadata files...',
        });

        this.createAskResourcesConfig(true);
        this.createAskStateConfig();
        progressBar.report({
            increment: incrAmount,
            message: 'Skill metadata files created. Checking skill package...',
        });

        GitInTerminalHelper.addFilesToIgnore(this.fsPath, this.filesToIgnore());

        createSkillPackageFolder(this.fsPath);
        progressBar.report({
            increment: incrAmount,
            message: 'Skill package created. Syncing from service...',
        });

        const skillPkgPath = path.join(this.fsPath, SKILL_FOLDER.SKILL_PACKAGE.NAME);
        const skillStage = BRANCH_TO_STAGE[skillRepo.state.HEAD!.name!];
        const skillPackageStatus = await syncSkillPackage(skillPkgPath, this.skillInfo.data.skillSummary.skillId!, this.context, skillStage);
        void this.postCloneSkill(true, skillPackageStatus.skill?.eTag);
        progressBar.report({
            increment: incrAmount,
            message: 'Skill package synced.',
        });
    }
}
