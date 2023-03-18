/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs-extra";
import * as path from "path";
import * as vscode from "vscode";
import {API, Change, Repository} from "../../../@types/git";
import {
  BRANCH_TO_STAGE,
  DEFAULT_PROFILE,
  DEPLOY_HOSTED_LOCAL_CHANGE_STATE_CONTENT,
  DEPLOY_HOSTED_SKILL_CODE_STATE_CONTENT,
  DEPLOY_HOSTED_SKILL_PACKAGE_STATE_CONTENT,
  SKILL,
  SKILL_FOLDER,
  TELEMETRY_EVENTS,
} from "../../../constants";
import {AskError, logAskError} from "../../../exceptions";
import {ext} from "../../../extensionGlobals";
import {Logger} from "../../../logger";
import {AskStates} from "../../../models/resourcesConfig/askStates";
import {AbstractWebView, Utils} from "../../../runtime";
import {TelemetryClient} from "../../../runtime/lib/telemetry";
import {ActionType} from "../../../runtime/lib/telemetry/constants";
import {isNonEmptyString} from "../../../runtime/lib/utils";
import {getOrInstantiateGitApi} from "../../../utils/gitHelper";
import {getSkillDetailsFromWorkspace} from "../../../utils/skillHelper";
import {getSkillPackageStatus} from "../../../utils/skillPackageHelper";
import {ViewLoader} from "../../../utils/webViews/viewLoader";
import {getSkillFolderInWs} from "../../../utils/workspaceHelper";
import {DeployHostedSkillManager} from "./deployHostedSkillManager";

enum DeployType {
  gitPush,
  deploySkillPackage,
}

enum LocalChangesStates {
  untracked,
  unstaged,
  staged,
  committed,
  noChanges,
  invalidBranch,
}

enum SkillPackageStates {
  upToDate,
  outOfSync,
  noETag,
  liveSkill,
  noSkillPackage,
  serviceError,
}

enum SkillCodeStates {
  upToDate,
  outOfSync,
  ahead,
  diverged,
  noSkillCode,
  serviceError,
}

interface StateContent {
  state: LocalChangesStates | SkillPackageStates | SkillCodeStates;
  text: string;
  valid: boolean;
}

export class DeployHostedSkillWebview extends AbstractWebView {
  private loader: ViewLoader;
  private gitApi!: API;
  private currentRepoState: {
    changesWithHead: Change[] | undefined;
    changesIndexWithHead: Change[] | undefined;
    commitId: string | undefined;
    headAhead: number | undefined;
    branch: string | undefined;
    workTreeChanges: number | undefined;
  };
  private skillRepo: Repository | null;
  private changesStateContent: StateContent | undefined;
  private skillPackageStatesContent: StateContent | undefined;
  private skillCodeSyncStateContent: StateContent | undefined;
  private askStates: AskStates | undefined;

  constructor(viewTitle: string, viewId: string, context: vscode.ExtensionContext) {
    super(viewTitle, viewId, context);
    this.loader = new ViewLoader(this.extensionContext, "deployHostedSkill", this);
    void getOrInstantiateGitApi(context).then((value) => {
      if (value === undefined) {
        throw logAskError("No git extension found.", null, true);
      }
      this.gitApi = value;
    });
    this.skillRepo = null;
    this.currentRepoState = {
      changesWithHead: undefined,
      changesIndexWithHead: undefined,
      commitId: undefined,
      headAhead: undefined,
      branch: undefined,
      workTreeChanges: undefined,
    };
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async onViewChangeListener(event: vscode.WebviewPanelOnDidChangeViewStateEvent): Promise<void> {
    Logger.debug(`Calling method: ${this.viewId}.onViewChangeListener`);
    if (event.webviewPanel.visible) {
      ext.skillPackageWatcher.validate();
      void this.refresh();
    }
  }

  async onReceiveMessageListener(message: string): Promise<void> {
    Logger.debug(`Calling method: ${this.viewId}.onReceiveMessageListener, args: `, message);
    if (message === "refresh") {
      ext.skillPackageWatcher.validate();
      void this.refresh(true);
    } else if (message === "deploySkill" || message === "forceDeploy") {
      const telemetryEventName = TELEMETRY_EVENTS.DEPLOY_HOSTED_SKILL_TELEMETRY_EVENT;
      const action = TelemetryClient.getInstance().startAction(telemetryEventName, ActionType.EVENT);
      try {
        const skillFolder = getSkillFolderInWs(this.extensionContext);
        if (skillFolder === undefined) {
          throw new AskError("No skill folder found in the workspace");
        }
        this.skillRepo = this.gitApi.getRepository(skillFolder);
        if (this.skillRepo === null) {
          throw new AskError(
            "No skill repository found. Please make sure the skill exists in the Developer Console and download it again.",
          );
        }
        await this.updateCurrentRepoState();
        const branch = this.currentRepoState.branch;
        if (branch === undefined) {
          throw new AskError("Failed to fetch git branch");
        }
        this.getPanel().webview.html = this.loader.renderView({
          name: "deployInProgress",
          errorMsg: "Skill deployment in progress...",
        });
        const deployType = await this.validateAndGetDeployType(skillFolder, this.skillRepo, branch, message);

        const deployHostedSkillManager = new DeployHostedSkillManager(this.extensionContext, skillFolder, this.skillRepo);
        if (deployType === DeployType.deploySkillPackage) {
          await deployHostedSkillManager.deploySkillPackage(this, true);
        } else {
          await deployHostedSkillManager.deploySkill(this);
        }
        await TelemetryClient.getInstance().store(action);
      } catch (err) {
        await TelemetryClient.getInstance().store(action, err);
        this.dispose();
        throw logAskError(`Skill deploy failed`, err, true);
      }
    } else if (message === "exportSkillPackage") {
      const hasDownloaded = await vscode.commands.executeCommand("ask.exportSkillPackage");
      if (hasDownloaded === true) {
        void this.refresh(true);
      }
    } else {
      throw logAskError("Unexpected message received from webview.");
    }
  }

  getHtmlForView(...args: any[]): string {
    Logger.debug(`Calling method: ${this.viewId}.getHtmlForView`);
    const skillFolder = getSkillFolderInWs(this.extensionContext);
    if (skillFolder === undefined) {
      throw new AskError("No skill folder found in the workspace");
    }
    this.askStates = new AskStates(skillFolder.fsPath);
    const skillDetails = getSkillDetailsFromWorkspace(this.extensionContext);
    const skillId: string = skillDetails.skillId;
    const skillName: string = skillDetails.skillName;
    const webview: vscode.Webview = this.getWebview();
    const skillDeployCss: vscode.Uri = webview.asWebviewUri(
      vscode.Uri.file(path.join(this.extensionContext.extensionPath, "media", "skillDeploy.css")),
    );
    this.clearUpStateContentsCache();
    this.refresh();
    return this.loader.renderView({
      name: "deployHostedSkill",
      js: true,
      args: {skillId, skillName, skillDeployCss},
    });
  }

  private async validateAndGetDeployType(
    skillFolder: vscode.Uri,
    skillRepo: Repository,
    branch: string,
    message: string,
  ): Promise<DeployType> {
    const changesStateContent = this.getLocalChangesState(branch);
    if (
      changesStateContent.state !== LocalChangesStates.committed &&
      !(message === "forceDeploy" && changesStateContent.state !== LocalChangesStates.invalidBranch)
    ) {
      void this.refresh();
      throw new AskError(changesStateContent.text);
    }
    const skillPackageStatesContent = await this.getSkillPackageSyncState(skillFolder, branch);
    if (
      skillPackageStatesContent.state !== SkillPackageStates.upToDate &&
      !(message === "forceDeploy" && skillPackageStatesContent.state === SkillPackageStates.outOfSync) &&
      !(message === "forceDeploy" && skillPackageStatesContent.state === SkillPackageStates.noETag)
    ) {
      void this.refresh();
      throw new AskError(skillPackageStatesContent.text);
    }

    const skillCodeState = await this.getSkillCodeSyncStates(skillFolder, skillRepo, branch);
    if (skillCodeState.state !== SkillCodeStates.upToDate && skillCodeState.state !== SkillCodeStates.ahead) {
      void this.refresh();
      throw new AskError(skillCodeState.text);
    }
    if (message === "forceDeploy" && skillCodeState.state === SkillCodeStates.upToDate) {
      return DeployType.deploySkillPackage;
    } else {
      return DeployType.gitPush;
    }
  }

  private async refresh(loading?: boolean): Promise<void> {
    Logger.verbose(`Calling method: ${this.viewId}.refresh`);

    if (this.isDisposed() === true) {
      return;
    }
    if (loading === true) {
      this.clearUpStateContentsCache();
    }
    try {
      const skillFolder = getSkillFolderInWs(this.extensionContext);
      if (skillFolder === undefined) {
        throw new AskError("No skill folder found in the workspace");
      }
      this.skillRepo = this.gitApi.getRepository(skillFolder);
      if (this.skillRepo === null) {
        throw new AskError("No skill repository found. Please make sure the skill exists in the Developer Console and download it again.");
      }
      this.skillRepo.state.onDidChange(() => {
        if (this.isDisposed() === true) {
          return;
        }
        void this.updateCurrentRepoState();
      });
      await this.updateCurrentRepoState();
      const branch = this.currentRepoState.branch;
      if (branch === undefined) {
        throw new AskError("Failed to fetch git branch");
      }
      await this.updateLocalChangesState(branch);
      await this.updateSkillPackageSyncState(skillFolder, branch);
      await this.updateSkillCodeSyncState(skillFolder, this.skillRepo, branch);
    } catch (error) {
      await this.postMessage(error);
      throw logAskError("Skill deploy and build page refresh failed", error, true);
    }
  }

  private async updateCurrentRepoState(): Promise<void> {
    Logger.verbose(`Calling method: ${this.viewId}.updateCurrentRepoState`);
    if (this.skillRepo === null) {
      return;
    }
    const changesWithHead = await this.skillRepo.diffWithHEAD();
    const changesIndexWithHead = await this.skillRepo.diffIndexWithHEAD();
    const commitId = this.skillRepo.state.HEAD?.commit;
    const headAhead = this.skillRepo.state.HEAD?.ahead;
    const branch = this.skillRepo.state.HEAD?.name;
    const workTreeChanges = this.skillRepo.state.workingTreeChanges.length;
    if (
      this.currentRepoState.changesWithHead === undefined ||
      this.currentRepoState.changesWithHead.length !== changesWithHead.length ||
      this.currentRepoState.changesIndexWithHead === undefined ||
      this.currentRepoState.changesIndexWithHead.length !== changesIndexWithHead.length ||
      this.currentRepoState.commitId !== commitId ||
      this.currentRepoState.headAhead !== headAhead ||
      this.currentRepoState.branch !== branch ||
      this.currentRepoState.workTreeChanges !== workTreeChanges
    ) {
      this.currentRepoState = {
        changesWithHead,
        changesIndexWithHead,
        commitId,
        headAhead,
        branch,
        workTreeChanges,
      };
      void this.refresh();
    }
  }

  private clearUpStateContentsCache() {
    this.changesStateContent = undefined;
    this.skillPackageStatesContent = undefined;
    this.skillCodeSyncStateContent = undefined;
  }

  private async updateLocalChangesState(branch: string) {
    this.changesStateContent = this.getLocalChangesState(branch);
    await this.postMessage();
  }

  private async updateSkillPackageSyncState(skillFolder: vscode.Uri, branch: string): Promise<void> {
    this.skillPackageStatesContent = await this.getSkillPackageSyncState(skillFolder, branch);
    await this.postMessage();
  }

  private async updateSkillCodeSyncState(skillFolder: vscode.Uri, skillRepo: Repository, branch: string): Promise<void> {
    this.skillCodeSyncStateContent = await this.getSkillCodeSyncStates(skillFolder, skillRepo, branch);
    await this.postMessage();
  }

  private async postMessage(error?: any) {
    if (this.isDisposed() === true) {
      return;
    }
    await this.getWebview().postMessage({
      branch: this.currentRepoState.branch,
      changesStateContent: this.changesStateContent,
      skillPackageStatesContent: this.skillPackageStatesContent,
      skillCodeSyncStateContent: this.skillCodeSyncStateContent,
      states: {LocalChangesStates, SkillPackageStates, SkillCodeStates},
      error,
    });
  }

  private getLocalChangesState(branch: string): StateContent {
    Logger.verbose(`Calling method: ${this.viewId}.getLocalChangesState, args: `, branch);
    if (BRANCH_TO_STAGE[branch] === undefined) {
      return this.resolveLocalChangeStateContent(LocalChangesStates.invalidBranch, branch);
    }
    if (this.currentRepoState.changesWithHead !== undefined && this.currentRepoState.changesWithHead.length !== 0) {
      return this.resolveLocalChangeStateContent(LocalChangesStates.unstaged, branch);
    }
    if (this.currentRepoState.changesIndexWithHead !== undefined && this.currentRepoState.changesIndexWithHead.length !== 0) {
      return this.resolveLocalChangeStateContent(LocalChangesStates.staged, branch);
    }
    if (this.currentRepoState.headAhead !== undefined && this.currentRepoState.headAhead !== 0) {
      return this.resolveLocalChangeStateContent(LocalChangesStates.committed, branch);
    }
    if (this.currentRepoState.workTreeChanges !== 0) {
      return this.resolveLocalChangeStateContent(LocalChangesStates.untracked, branch);
    }
    return this.resolveLocalChangeStateContent(LocalChangesStates.noChanges, branch);
  }

  private resolveLocalChangeStateContent(state: LocalChangesStates, branch: string): StateContent {
    Logger.verbose(`Calling method: ${this.viewId}.resolveLocalChangeStateContent, args: `, state, branch);
    if (state === LocalChangesStates.untracked) {
      return {
        state,
        text: DEPLOY_HOSTED_LOCAL_CHANGE_STATE_CONTENT.UNTRACKED(branch),
        valid: false,
      };
    } else if (state === LocalChangesStates.unstaged || state === LocalChangesStates.staged) {
      return {
        state,
        text: DEPLOY_HOSTED_LOCAL_CHANGE_STATE_CONTENT.UNSTAGED(branch),
        valid: false,
      };
    } else if (state === LocalChangesStates.noChanges) {
      return {
        state,
        text: DEPLOY_HOSTED_LOCAL_CHANGE_STATE_CONTENT.NO_CHANGE(branch),
        valid: false,
      };
    } else if (state === LocalChangesStates.invalidBranch) {
      return {
        state,
        text: DEPLOY_HOSTED_LOCAL_CHANGE_STATE_CONTENT.INVALID_BRANCH,
        valid: false,
      };
    } else {
      return {
        state: LocalChangesStates.committed,
        text: DEPLOY_HOSTED_LOCAL_CHANGE_STATE_CONTENT.COMMITTED(branch),
        valid: true,
      };
    }
  }

  private async getSkillPackageSyncState(skillFolder: vscode.Uri, branch: string): Promise<StateContent> {
    Logger.verbose(`Calling method: ${this.viewId}.getSkillPackageSyncState, args:`, skillFolder, branch);
    const skillPkgPath = path.join(skillFolder.fsPath, SKILL_FOLDER.SKILL_PACKAGE.NAME);
    if (!fs.existsSync(skillPkgPath)) {
      return this.resolveSkillPackageStateContent(SkillPackageStates.noSkillPackage);
    }
    const skillStage = BRANCH_TO_STAGE[branch];
    if (skillStage === SKILL.STAGE.LIVE) {
      return this.resolveSkillPackageStateContent(SkillPackageStates.liveSkill);
    }
    const skillDetails = getSkillDetailsFromWorkspace(this.extensionContext);
    const skillId = skillDetails.skillId;
    if (!isNonEmptyString(skillId)) {
      throw new AskError("Failed to get the skill id in .ask/ask-states.json.");
    }
    let skillPackageStatus;
    try {
      skillPackageStatus = await getSkillPackageStatus(this.extensionContext, skillDetails.skillId, skillStage);
    } catch (error) {
      return this.resolveSkillPackageStateContent(SkillPackageStates.serviceError, error.message);
    }
    const remoteETag = skillPackageStatus.skill?.eTag;
    const localETag = this.getLocalETag(skillFolder, skillStage);
    if (localETag === undefined || typeof localETag !== "string") {
      return this.resolveSkillPackageStateContent(SkillPackageStates.noETag);
    }
    return localETag === remoteETag
      ? this.resolveSkillPackageStateContent(SkillPackageStates.upToDate)
      : this.resolveSkillPackageStateContent(SkillPackageStates.outOfSync);
  }

  private getLocalETag(skillFolder: vscode.Uri, skillStage: string): string | undefined {
    Logger.verbose(`Calling method: ${this.viewId}.getLocalETag, args:`, skillFolder, skillStage);
    let profile = Utils.getCachedProfile(this.extensionContext);
    profile = profile ?? DEFAULT_PROFILE;
    if (this.askStates === undefined) {
      this.askStates = new AskStates(skillFolder.fsPath);
    } else {
      this.askStates.read();
    }
    return this.askStates.getSkillMetaETag(profile);
  }

  private resolveSkillPackageStateContent(state: SkillPackageStates, error?: string): StateContent {
    Logger.verbose(`Calling method: ${this.viewId}.resolveSkillPackageStateContent, args:`, state, error);
    if (state === SkillPackageStates.outOfSync) {
      return {
        state,
        text: DEPLOY_HOSTED_SKILL_PACKAGE_STATE_CONTENT.OUT_OF_SYNC,
        valid: false,
      };
    } else if (state === SkillPackageStates.noETag) {
      return {
        state,
        text: DEPLOY_HOSTED_SKILL_PACKAGE_STATE_CONTENT.NO_ETAG,
        valid: false,
      };
    } else if (state === SkillPackageStates.liveSkill) {
      return {
        state,
        text: DEPLOY_HOSTED_SKILL_PACKAGE_STATE_CONTENT.LIVE_SKILL,
        valid: false,
      };
    } else if (state === SkillPackageStates.noSkillPackage) {
      return {
        state,
        text: DEPLOY_HOSTED_SKILL_PACKAGE_STATE_CONTENT.NO_SKILL_PACKAGE,
        valid: false,
      };
    } else if (state === SkillPackageStates.serviceError) {
      return {
        state,
        text: DEPLOY_HOSTED_SKILL_PACKAGE_STATE_CONTENT.SERVICE_ERROR(error),
        valid: false,
      };
    } else {
      return {
        state: SkillPackageStates.upToDate,
        text: DEPLOY_HOSTED_SKILL_PACKAGE_STATE_CONTENT.UP_TO_DATE,
        valid: true,
      };
    }
  }

  private async getSkillCodeSyncStates(skillFolder: vscode.Uri, skillRepo: Repository, branch: string): Promise<StateContent> {
    Logger.verbose(`Calling method: ${this.viewId}.syncSkillCodeSyncWithRemote, args:`, skillFolder);
    const skillCodePath = path.join(skillFolder.fsPath, SKILL_FOLDER.LAMBDA.NAME);
    if (!fs.existsSync(skillCodePath)) {
      return this.resolveSkillCodeStateContent(SkillCodeStates.noSkillCode);
    }
    let aheadCommits: number | undefined;
    let behindCommits: number | undefined;
    try {
      await skillRepo.fetch("origin", branch);
      aheadCommits = skillRepo.state.HEAD?.ahead;
      behindCommits = skillRepo.state.HEAD?.behind;
    } catch (error) {
      return this.resolveSkillCodeStateContent(SkillCodeStates.serviceError, error);
    }
    if (aheadCommits !== undefined && aheadCommits !== 0 && behindCommits !== undefined && behindCommits !== 0) {
      return this.resolveSkillCodeStateContent(SkillCodeStates.diverged);
    }
    if (aheadCommits !== undefined && aheadCommits !== 0) {
      return this.resolveSkillCodeStateContent(SkillCodeStates.ahead);
    }
    if (behindCommits !== undefined && behindCommits !== 0) {
      return this.resolveSkillCodeStateContent(SkillCodeStates.outOfSync);
    }
    return this.resolveSkillCodeStateContent(SkillCodeStates.upToDate);
  }

  private resolveSkillCodeStateContent(state: SkillCodeStates, error?: string): StateContent {
    Logger.verbose(`Calling method: ${this.viewId}.resolveSkillCodeStateContent, args:`, state, error);
    if (state === SkillCodeStates.outOfSync) {
      return {
        state,
        text: DEPLOY_HOSTED_SKILL_CODE_STATE_CONTENT.OUT_OF_SYNC,
        valid: false,
      };
    } else if (state === SkillCodeStates.noSkillCode) {
      return {
        state,
        text: DEPLOY_HOSTED_SKILL_CODE_STATE_CONTENT.NO_SKILL_CODE,
        valid: false,
      };
    } else if (state === SkillCodeStates.ahead) {
      return {
        state,
        text: DEPLOY_HOSTED_SKILL_CODE_STATE_CONTENT.AHEAD,
        valid: true,
      };
    } else if (state === SkillCodeStates.diverged) {
      return {
        state,
        text: DEPLOY_HOSTED_SKILL_CODE_STATE_CONTENT.DIVERGED,
        valid: false,
      };
    } else if (state === SkillCodeStates.serviceError) {
      return {
        state,
        text: DEPLOY_HOSTED_SKILL_CODE_STATE_CONTENT.SERVICE_ERROR(error),
        valid: false,
      };
    } else {
      return {
        state: SkillCodeStates.upToDate,
        text: DEPLOY_HOSTED_SKILL_CODE_STATE_CONTENT.UP_TO_DATE,
        valid: true,
      };
    }
  }
}
