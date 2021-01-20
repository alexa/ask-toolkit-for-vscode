import * as fs from "fs-extra";
import * as path from "path";
import * as vscode from "vscode";

import { DEFAULT_PROFILE, SKILL, TELEMETRY_EVENTS } from "../../../constants";
import { AbstractWebView, Utils } from "../../../runtime";
import { AskStates } from '../../../models/resourcesConfig/askStates';
import { getHash } from "../../../utils/hashHelper";
import { ViewLoader } from "../../../utils/webViews/viewLoader";
import { DeployNonHostedSkillManager } from "./deployNonHostedSkillManager";
import {
    getSkillMetadataSrc,
    getSkillDetailsFromWorkspace,
} from "../../../utils/skillHelper";
import { getSkillPackageStatus } from "../../../utils/skillPackageHelper";
import { Logger } from "../../../logger";
import { AskError, loggableAskError } from "../../../exceptions";
import { getSkillFolderInWs } from "../../../utils/workspaceHelper";
import { ext } from "../../../extensionGlobals";
import { isNonEmptyString } from "../../../runtime/lib/utils";
import { TelemetryClient } from "../../../runtime/lib/telemetry";

enum LocalChangesStates {
    noChanges,
    changesExist,
}

enum SkillPackageStates {
    upToDate,
    outOfSync,
    noETag,
    noSkillPackage,
    serviceError,
}

interface StateContent {
    state: LocalChangesStates | SkillPackageStates;
    text: string;
    valid: boolean;
}

export class DeployNonHostedSkillWebview extends AbstractWebView {
    private loader: ViewLoader;
    private changesStateContent: StateContent | undefined;
    private skillPackageStatesContent: StateContent | undefined;
    private skillName: string | undefined;
    private skillPackagePath: string | undefined;
    private askStates: AskStates | undefined;

    constructor(viewTitle: string, viewId: string, context: vscode.ExtensionContext) {
        super(viewTitle, viewId, context);
        this.loader = new ViewLoader(this.extensionContext, "deployNonHostedSkill", this);
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
        const skillFolder = getSkillFolderInWs(this.extensionContext);
        if (skillFolder === undefined) {
            throw loggableAskError("No skill folder found in the workspace.", null, true);
        }

        if (message === "refresh") {
            ext.skillPackageWatcher.validate();
            void this.refresh(true);
        } else if (message === "deploySkill" || message === "forceDeploy") {
            const telemetryClient = new TelemetryClient({});
            const telemetryEventName = TELEMETRY_EVENTS.DEPLOY_SELF_HOSTED_SKILL_TELEMETRY_EVENT;
            try {
                telemetryClient.startAction(telemetryEventName, 'event');
                let profile = Utils.getCachedProfile(this.extensionContext);
                profile = profile ?? DEFAULT_PROFILE;
                await this.validateAllDeployStates(skillFolder, message, profile);
                this.getPanel().webview.html = this.loader.renderView({
                    name: "deployInProgress",
                    errorMsg: "Skill deployment in progress...",
                });
                const { skillPackageAbsPath } = getSkillMetadataSrc(skillFolder.fsPath, profile);
                const currentHash = await getHash(skillPackageAbsPath);
                const eTag = this.getLocalETag(skillFolder);
                const deployNonHostedSkillManager = new DeployNonHostedSkillManager(
                    this.extensionContext,
                    skillFolder,
                    currentHash.hash
                );
                await deployNonHostedSkillManager.deploySkill(this, message === "forceDeploy", eTag);
                void telemetryClient.sendData();
            } catch (err) {
                void telemetryClient.sendData(err);
                this.dispose();
                throw loggableAskError(`Skill deploy failed`, err, true);
            }
        } else if (message === "exportSkillPackage") {
            const hasDownloaded = await vscode.commands.executeCommand("ask.exportSkillPackage");
            if (hasDownloaded === true) {
                void this.refresh(true);
            }
        } else {
            throw loggableAskError("Unexpected message received from webview.");
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
        const skillId = skillDetails.skillId;
        this.skillName = skillDetails.skillName;
        const webview: vscode.Webview = this.getWebview();
        const skillDeployCss: vscode.Uri = webview.asWebviewUri(
            vscode.Uri.file(path.join(this.extensionContext.extensionPath, "media", "skillDeploy.css"))
        );
        this.clearUpStateContentsCache();
        return this.loader.renderView({
            name: "deployNonHostedSkill",
            js: true,
            args: { skillId, skillName: this.skillName, skillDeployCss },
        });
    }

    private async validateAllDeployStates(skillFolder: vscode.Uri, message: string, profile: string) {
        const changesStateContent = await this.getLocalChangesState(skillFolder);
        if (changesStateContent.state === LocalChangesStates.noChanges &&
            message !== "forceDeploy") {
            void this.refresh();
            throw new AskError(changesStateContent.text);
        }
        const skillDetails = getSkillDetailsFromWorkspace(this.extensionContext);
        const skillPackageStatesContent = await this.getSkillPackageState(skillFolder, skillDetails.skillId, profile);
        if (
            skillPackageStatesContent.state !== SkillPackageStates.upToDate &&
            !(message === "forceDeploy" && skillPackageStatesContent.state === SkillPackageStates.outOfSync) &&
            !(message === "forceDeploy" && skillPackageStatesContent.state === SkillPackageStates.noETag)
        ) {
            void this.refresh();
            throw new AskError(skillPackageStatesContent.text);
        }
    }

    private async refresh(loading?: boolean): Promise<void> {
        Logger.verbose(`Calling method: ${this.viewId}.refresh`);

        if (this.isDisposed() === true) {
            return;
        }
        if (loading === true) {
            this.clearUpStateContentsCache();
            this.postMessage();
        }
        try {
            const skillFolder = getSkillFolderInWs(this.extensionContext);
            if (skillFolder === undefined) {
                throw new AskError("No skill folder found in the workspace");
            }
            const skillDetails = getSkillDetailsFromWorkspace(this.extensionContext);
            this.skillName = skillDetails.skillName;
            let profile = Utils.getCachedProfile(this.extensionContext);
            profile = profile ?? DEFAULT_PROFILE;

            this.updateSkillPackageSrc(skillFolder, profile, this.skillName);
            await this.updateLocalChangesState(skillFolder);
            await this.updateSkillPackageSyncState(skillFolder, skillDetails.skillId, profile);
        } catch (error) {
            this.postMessage(error);
            throw loggableAskError("Skill deploy and build page refresh failed", error, true);
        }
    }

    private clearUpStateContentsCache() {
        this.changesStateContent = undefined;
        this.skillPackageStatesContent = undefined;
    }

    private updateSkillPackageSrc(skillFolder: vscode.Uri, profile: string, skillName: string) {
        const { skillPackageSrc } = getSkillMetadataSrc(skillFolder.fsPath, profile);
        this.skillPackagePath = `${skillName}/${skillPackageSrc}`;
        this.postMessage();
    }

    private async updateLocalChangesState(skillFolder: vscode.Uri) {
        this.changesStateContent = await this.getLocalChangesState(skillFolder);
        this.postMessage();
    }

    private async updateSkillPackageSyncState(skillFolder: vscode.Uri, skillId: string, profile: string) {
        this.skillPackageStatesContent = await this.getSkillPackageState(skillFolder, skillId, profile);
        this.postMessage();
    }

    private postMessage(error?: any) {
        void this.getWebview().postMessage({
            skillPackagePath: this.skillPackagePath,
            changesStateContent: this.changesStateContent,
            skillPackageStatesContent: this.skillPackageStatesContent,
            states: { LocalChangesStates, SkillPackageStates },
            error
        });
    }

    private async getLocalChangesState(skillFolder: vscode.Uri): Promise<StateContent> {
        Logger.verbose(`Calling method: ${this.viewId}.getLocalChangesStates`);

        const lastDeployHash = this.getLastDeployHash(skillFolder);
        if (lastDeployHash === undefined) {
            return this.resolveLocalChangeStateContent(LocalChangesStates.changesExist);
        }
        try {
            let profile = Utils.getCachedProfile(this.extensionContext);
            profile = profile ?? DEFAULT_PROFILE;
            const { skillPackageAbsPath } = getSkillMetadataSrc(skillFolder.fsPath, profile);
            const currentHash = await getHash(skillPackageAbsPath);
            return currentHash.hash !== lastDeployHash
                ? this.resolveLocalChangeStateContent(LocalChangesStates.changesExist)
                : this.resolveLocalChangeStateContent(LocalChangesStates.noChanges);
        } catch (error) {
            throw loggableAskError("Failed to get local changes state", error);
        }
    }

    private resolveLocalChangeStateContent(state: LocalChangesStates): StateContent {
        Logger.verbose(`Calling method: ${this.viewId}.resolveLocalChangeStateContent, args:`, state);
        if (state === LocalChangesStates.noChanges) {
            return {
                state,
                text: "There are no changes to deploy. To deploy this skill, make a change to the project.",
                valid: false,
            };
        } else {
            return {
                state,
                text: "Changes exist in the skill. Ready to deploy.",
                valid: true,
            };
        }
    }

    private async getSkillPackageState(
        skillFolder: vscode.Uri,
        skillId: string,
        profile: string
    ): Promise<StateContent> {
        Logger.verbose(`Calling method: ${this.viewId}.getSkillPackageStates, args:`, skillFolder);
        const { skillPackageAbsPath } = getSkillMetadataSrc(skillFolder.fsPath, profile);
        if (!fs.existsSync(skillPackageAbsPath)) {
            return this.resolveSkillPackageStateContent(SkillPackageStates.noSkillPackage);
        }
        if (!isNonEmptyString(skillId)) {
            throw new AskError("Failed to get the skill id in .ask/ask-states.json.");
        }
        let skillPackageStatus;
        try {
            skillPackageStatus = await getSkillPackageStatus(this.extensionContext, skillId, SKILL.STAGE.DEVELOPMENT);
        } catch (error) {
            return this.resolveSkillPackageStateContent(SkillPackageStates.serviceError, error.message);
        }
        const remoteETag = skillPackageStatus.skill?.eTag;
        const localETag = this.getLocalETag(skillFolder);
        if (localETag === undefined || typeof localETag !== "string") {
            return this.resolveSkillPackageStateContent(SkillPackageStates.noETag);
        }
        return localETag === remoteETag
            ? this.resolveSkillPackageStateContent(SkillPackageStates.upToDate)
            : this.resolveSkillPackageStateContent(SkillPackageStates.outOfSync);
    }

    private resolveSkillPackageStateContent(state: SkillPackageStates, error?: string): StateContent {
        Logger.verbose(`Calling method: ${this.viewId}.resolveLocalChangeStateContent, args:`, state);
        if (state === SkillPackageStates.outOfSync) {
            return {
                state,
                text: "Skill package contents may not be up-to-date with Alexa service. Please ensure you have the latest changes before deploying.",
                valid: false,
            };
        } else if (state === SkillPackageStates.noETag) {
            return {
                state,
                text:
                    "Skill package contents may not be up-to-date with Alexa service. Please ensure you have the latest changes before deploying.",
                valid: false,
            };
        } else if (state === SkillPackageStates.noSkillPackage) {
            return {
                state,
                text:
                    "There is no skill-package found in the workspace. Merge skill-package to this branch to deploy the skill.",
                valid: false,
            };
        } else if (state === SkillPackageStates.serviceError) {
            return {
                state,
                text: error === undefined ? "Service error." : `Service Error: ${error}`,
                valid: false,
            };
        } else {
            return {
                state: SkillPackageStates.upToDate,
                text: "Last deployed skill package is up to date with Alexa service.",
                valid: true,
            };
        }
    }

    private getLocalETag(skillFolder: vscode.Uri): string | undefined {
        Logger.verbose(`Calling method: ${this.viewId}.getLocalETag, args:`, skillFolder);
        let profile = Utils.getCachedProfile(this.extensionContext);
        profile = profile ?? DEFAULT_PROFILE;
        if (this.askStates === undefined) {
            this.askStates = new AskStates(skillFolder.fsPath);
        } else {
            this.askStates.read();
        }
        return this.askStates.getSkillMetaETag(profile);
    }

    private getLastDeployHash(skillFolder: vscode.Uri): string | undefined {
        Logger.verbose(`Calling method: ${this.viewId}.getLastDeployHash, args:`, skillFolder);
        let profile = Utils.getCachedProfile(this.extensionContext);
        profile = profile ?? DEFAULT_PROFILE;
        if (this.askStates === undefined) {
            this.askStates = new AskStates(skillFolder.fsPath);
        } else {
            this.askStates.read();
        }
        return this.askStates.getSkillMetaLastDeployHash(profile);
    }
}
