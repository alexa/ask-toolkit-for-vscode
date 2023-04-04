/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as https from "https";
import * as path from "path";
import * as vscode from "vscode";
import {BRANCH_TO_STAGE, GIT_MESSAGES, SKILL, SKILL_FOLDER} from "../../../constants";
import {AskError, logAskError} from "../../../exceptions";
import {Logger} from "../../../logger";
import {SmapiClientFactory} from "../../../runtime";
import {GitInTerminalHelper, isGitInstalled} from "../../../utils/gitHelper";
import {checkAskPrePushScript, checkAuthInfoScript, checkGitCredentialHelperScript} from "../../../utils/s3ScriptChecker";
import {createSkillPackageFolder, syncSkillPackage} from "../../../utils/skillPackageHelper";
import {AbstractCloneSkillManager} from "./abstractCloneSkillManager";

export class CloneHostedSkillManager extends AbstractCloneSkillManager {
  async setupGitFolder(): Promise<void> {
    Logger.verbose(`Calling method: setupGitFolder`);
    try {
      const smapiClient = SmapiClientFactory.getInstance(this.profile, this.context);
      const skillId = this.skillInfo.data.skillSummary.skillId!;

      const credentialsList = await smapiClient.generateCredentialsForAlexaHostedSkillV1(skillId, {
        repository: this.skillInfo.data.hostedSkillMetadata!.alexaHosted!.repository!,
      });
      const {repositoryCredentials} = credentialsList;
      if (
        repositoryCredentials === undefined ||
        repositoryCredentials.username === undefined ||
        repositoryCredentials.password === undefined
      ) {
        throw new AskError("Failed to retrieve hosted skill credentials from the service.");
      }
      const gitHelper = new GitInTerminalHelper(this.fsPath, Logger.logLevel);
      const repoUrl = this.skillInfo.data.hostedSkillMetadata?.alexaHosted?.repository?.url;
      if (repoUrl === undefined) {
        throw new AskError("Failed to retrieve hosted skill repo URL from the service.");
      }
      await this.downloadGitCredentialScript(this.fsPath, this.context);
   
      gitHelper.init();
      gitHelper.configureCredentialHelper(repoUrl, this.profile, skillId);
      gitHelper.addOrigin(repoUrl);
      gitHelper.fetchAll();
      gitHelper.checkoutBranch("prod")
      gitHelper.checkoutBranch("master");

      await this.setPrePushHookScript(this.fsPath, this.context);
    } catch (err) {
      throw logAskError(`Git folder setup failed for ${this.fsPath}`, err);
    }
  }

  downloadScriptFile(scriptUrl: string, filePath: string, chmod: string): Promise<void> {
    Logger.verbose(`Calling method: downloadScriptFile, args: `, scriptUrl, filePath, chmod);
    const file = fs.createWriteStream(filePath);
    return new Promise((resolve, reject) => {
      const request = https.get(scriptUrl, (resp) => {
        resp.pipe(file);
        fs.chmodSync(filePath, chmod);
        resolve();
      });
      request.on("error", (err) => {
        reject(logAskError("Download script failed ", err));
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
      SKILL_FOLDER.HIDDEN_GIT_FOLDER.HOOKS.PRE_PUSH,
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
    return [SKILL_FOLDER.ASK_RESOURCES_JSON_CONFIG, SKILL_FOLDER.HIDDEN_ASK_FOLDER, SKILL_FOLDER.HIDDEN_VSCODE, nodeModules];
  }

  async cloneSkill(progressBar: vscode.Progress<{message: string; increment: number}>, incrAmount?: number): Promise<void> {
    Logger.verbose(`Calling method: cloneSkill, args: `, progressBar);

    this.checkGitInstallation();
    const incrementAmount = incrAmount ?? 25;

    fs.mkdirSync(path.join(this.fsPath, SKILL_FOLDER.HIDDEN_ASK_FOLDER));

    await this.setupGitFolder();
    progressBar.report({
      increment: incrementAmount,
      message: "Git access set. Checking skill metadata files...",
    });

    this.createAskResourcesConfig(true);
    this.createAskStateConfig();
    progressBar.report({
      increment: incrementAmount,
      message: "Skill metadata files created. Checking skill package...",
    });

    GitInTerminalHelper.addFilesToIgnore(this.fsPath, this.filesToIgnore());

    createSkillPackageFolder(this.fsPath);
    progressBar.report({
      increment: incrementAmount,
      message: "Skill package created. Syncing from service...",
    });

    const skillPkgPath = path.join(this.fsPath, SKILL_FOLDER.SKILL_PACKAGE.NAME);
    const gitHelper = new GitInTerminalHelper(this.fsPath, Logger.logLevel);
    const curBranch = gitHelper.getCurrentBranch();
    const skillStage = BRANCH_TO_STAGE[curBranch];
    const skillPackageStatus = await syncSkillPackage(skillPkgPath, this.skillInfo.data.skillSummary.skillId!, this.context, skillStage);
    
    this.postCloneSkill(true, skillPackageStatus.skill?.eTag);
    progressBar.report({
      increment: incrementAmount,
      message: "Skill package synced.",
    });
  }
}
