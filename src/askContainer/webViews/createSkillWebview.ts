import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { AbstractWebView, SmapiClientFactory, Utils, SmapiResource } from '../../runtime';
import { DEFAULT_PROFILE, WEB_VIEW_NAME } from '../../constants';
import { createSkill } from '../../utils/createSkillHelper';
import { solveCaptcha } from '../../utils/captchaValidator';
import { SkillInfo } from '../../models/types';
import { cloneSkill } from '../../utils/cloneSkillHelper';
import { ViewLoader } from '../../utils/webViews/viewLoader';
import { openWorkspaceFolder } from '../../utils/workspaceHelper';
import { loggableAskError } from '../../exceptions';
import { Logger } from '../../logger';

type createSkillWebViewType = {
    locale: string;
    runtime: string;
    region: string;
    skillFolder: string;
    skillName: string;
};

export class CreateSkillWebview extends AbstractWebView {
    private loader: ViewLoader;

    constructor(viewTitle: string, viewId: string, context: vscode.ExtensionContext) {
        super(viewTitle, viewId, context);
        this.isGlobal = true;
        this.loader = new ViewLoader(this.extensionContext, WEB_VIEW_NAME.CREATE_SKILL, this);
    }

    getHtmlForView(...args: unknown[]): string {
        Logger.debug(`Calling method: ${this.viewId}.getHtmlForView`);
        return this.loader.renderView({
            name: WEB_VIEW_NAME.CREATE_SKILL,
            js: true
        });
    }

    onViewChangeListener(event: vscode.WebviewPanelOnDidChangeViewStateEvent): void {
        Logger.debug(`Calling method: ${this.viewId}.onViewChangeListener`);

        return;
    }
    
    async onReceiveMessageListener(message: string | createSkillWebViewType): Promise<void> {
        Logger.debug(`Calling method: ${this.viewId}.onReceiveMessageListener`);
        if (message === 'selectFolder') {
            const selectFolderDialog = await vscode.window.showOpenDialog({
                "canSelectFiles": false,
                "canSelectFolders": true,
                "canSelectMany": false
            });
            this.getWebview()?.postMessage(
                {
                    selectedFolder: selectFolderDialog? selectFolderDialog[0].fsPath : '' 
                }
            );
        } else if (typeof message === "object") {
            if (!Utils.isNonBlankString(message.skillName) || !Utils.isNonBlankString(message.skillFolder) || !Utils.filterNonAlphanumeric(message.skillName)) {
                if (!Utils.isNonBlankString(message.skillName)) {
                    const errorMessage = "A skill name is required.";
                    Logger.error(errorMessage);
                    vscode.window.showErrorMessage(errorMessage);
                }
                if (!Utils.isNonBlankString(message.skillFolder)) {
                    const errorMessage = "A local directory path is required.";
                    Logger.error(errorMessage);
                    vscode.window.showErrorMessage(errorMessage);
                }
                if (!Utils.filterNonAlphanumeric(message.skillName)) {
                    const errorMessage = "A skill name must have alphanumeric characters.";
                    Logger.error(errorMessage);
                    vscode.window.showErrorMessage(errorMessage);
                }
                this.getWebview()?.postMessage(
                    {
                        reEnable: true 
                    }
                );
                return;
            }
            try {
                await this.authenticateNewUser();
                const filteredProjectName = Utils.filterNonAlphanumeric(message.skillName);
                const skillFolderUri = this.createSkillFolder(message.skillFolder, filteredProjectName);
                const profile = Utils.getCachedProfile(this.extensionContext) ?? DEFAULT_PROFILE;
                const vendorId = Utils.resolveVendorId(profile);
        
                // Create progress bar and run next steps
                await this.createSkillFlow(profile, message, skillFolderUri, vendorId);
                const skillCreateMsg = `${message.skillName} was successfully created.`;
                Logger.info(skillCreateMsg);
                await vscode.window.showInformationMessage(skillCreateMsg);
            } catch (err) {
                throw loggableAskError(`Skill creation failed`, err, true);
            }
        }
    }

    private createSkillFolder(skillFolder: string, skillName: string): vscode.Uri {
        Logger.verbose(`Calling method: ${this.viewId}.createSkillFolder, args: `, skillFolder, skillName);
        const skillFolderAbsPath = path.join(skillFolder, skillName);
        
        // create skill folder in project path
        if (fs.existsSync(skillFolderAbsPath)) {
            vscode.window.showWarningMessage(
                `Skill folder ${skillFolderAbsPath} already exists. It will be overwritten.`);
            fs.unlinkSync(skillFolderAbsPath);
        }

        fs.mkdirSync(skillFolderAbsPath);
    
        return vscode.Uri.file(skillFolderAbsPath);
    }

    private async createSmapiResource(skillId: string, skillName: string): Promise<SmapiResource<SkillInfo>> {
        Logger.verbose(`Calling method: ${this.viewId}.createSmapiResource, args: `, skillId, skillName);
        let profile = Utils.getCachedProfile(this.extensionContext);
        profile = profile ?? DEFAULT_PROFILE;
        let vendorId: string;
        try {
            vendorId = Utils.resolveVendorId(profile);
        } catch (err) {
            throw loggableAskError(`Failed to retrieve vendorID for profile ${profile}`, err, true);
        }

        const smapiClient = SmapiClientFactory.getInstance(profile, this.extensionContext);
        const skillSummary = (await smapiClient.listSkillsForVendorV1(
            vendorId, undefined, undefined, [skillId])).skills?.[0];
        if (!skillSummary) {
            throw loggableAskError("No skill is found.");
        }

        const hostedSkillMetadata = await smapiClient.getAlexaHostedSkillMetadataV1(skillId);
        if (hostedSkillMetadata === undefined) {
            throw loggableAskError("No Alexa hosted skill is found.");
        }

        return new SmapiResource(
            new SkillInfo(skillSummary, true, hostedSkillMetadata), 
            skillName);
    }

    private async createSkillFlow(profile: string, message: createSkillWebViewType, skillFolderUri: vscode.Uri, vendorId: string): Promise<void> {
        Logger.verbose(`Calling method: ${this.viewId}.createSkillFlow, args: `, profile, message, skillFolderUri, vendorId);
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Creating skill. This will take about a minute.",
            cancellable: false
        }, async (progress) => {
            if (!this.isDisposed()) {
                this.getPanel().webview.html = this.loader.renderView({
                    name: 'createInProgress',
                    errorMsg: 'Skill creation in progress...'
                });
            }

            const incrAmt = 25;
            const skillId = await createSkill(
                message.skillName, message.runtime, message.region, message.locale, profile ?? DEFAULT_PROFILE, vendorId, this.extensionContext);
            progress.report({
                increment: incrAmt,
                message: 'Skill created. Retrieving skill details...'
            });

            // Create skill info instance
            const smapiResource = await this.createSmapiResource(skillId, message.skillName);
            progress.report({
                increment: incrAmt,
                message: 'Skill details retrieved. Cloning into selected folder...'
            });

            // Clone skill into local folder
            await cloneSkill(
                smapiResource, skillFolderUri.fsPath, 
                this.extensionContext, progress);

            if (!this.isDisposed()) {
                this.getPanel().webview.html = this.loader.renderView({
                    name: 'createComplete',
                    errorMsg: 'Skill created.'
                });
            }
            await openWorkspaceFolder(skillFolderUri);
        });
    }

    private async authenticateNewUser(): Promise<void> {
        Logger.verbose(`Calling method: ${this.viewId}.authenticateNewUser`);
        let profile = Utils.getCachedProfile(this.extensionContext);
        profile = profile ?? DEFAULT_PROFILE;
        const vendorId = Utils.resolveVendorId(profile);
        const permission = await SmapiClientFactory.getInstance(profile, this.extensionContext).getAlexaHostedSkillUserPermissionsV1(vendorId, 'newSkill');
        if (permission.actionUrl) {
            this.getPanel().webview.html = this.loader.renderView({
                name: 'authenticateAccount',
                errorMsg: 'Authenticate your account in your browser.'
            });
            await solveCaptcha(vendorId, permission.actionUrl);
        }
    }

}