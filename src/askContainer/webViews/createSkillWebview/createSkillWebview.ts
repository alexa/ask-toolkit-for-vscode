/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { DEFAULT_PROFILE, SKILL, TELEMETRY_EVENTS } from '../../../constants';
import { logAskError } from '../../../exceptions';
import { Logger } from '../../../logger';
import { AbstractWebView, SmapiClientFactory, Utils } from '../../../runtime';
import { ActionType, TelemetryClient } from '../../../runtime/lib/telemetry';
import { solveCaptcha } from '../../../utils/captchaValidator';
import { ViewLoader } from '../../../utils/webViews/viewLoader';
import { openWorkspaceFolder } from '../../../utils/workspaceHelper';
import { CreateHostedSkillManager } from './createHostedSkillManager';
import { CreateNonHostedSkillManager } from './createNonHostedSkillManager';


export type createSkillWebViewType = {
    locale: string;
    runtime: string;
    region: string;
    skillFolder: string;
    skillName: string;
    language: string;
    isHostedSkill: boolean;
};

export class CreateSkillWebview extends AbstractWebView {
    private loader: ViewLoader;
    private context: vscode.ExtensionContext;

    constructor(viewTitle: string, viewId: string, context: vscode.ExtensionContext) {
        super(viewTitle, viewId, context);
        this.isGlobal = true;
        this.loader = new ViewLoader(this.extensionContext, 'createSkill', this);
        this.context = context;
    }

    getHtmlForView(...args: unknown[]): string {
        Logger.debug(`Calling method: ${this.viewId}.getHtmlForView`);
        const webview: vscode.Webview = this.getWebview();
        const skillCreateCss: vscode.Uri = webview.asWebviewUri(
            vscode.Uri.file(path.join(this.extensionContext.extensionPath, 'media', 'createSkill', 'createSkill.css'))
        );
        return this.loader.renderView({
            name: 'createSkill',
            js: true,
            customCss: skillCreateCss,
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
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
            });
            void this.getWebview()?.postMessage({
                selectedFolder: selectFolderDialog ? selectFolderDialog[0].fsPath : '',
            });
        } else if (typeof message === 'object') {
            try {
                this.validateSkillName(message.skillName);
            } catch (error) {
                Logger.error(error);
                void vscode.window.showErrorMessage(error);
                void this.getWebview()?.postMessage({
                    reEnable: true,
                });
                return;
            }

            const telemetryEventName = message.isHostedSkill
                ? TELEMETRY_EVENTS.CREATE_HOSTED_SKILL_TELEMETRY_EVENT
                : TELEMETRY_EVENTS.CREATE_SELF_HOSTED_SKILL_TELEMETRY_EVENT;
            const action = TelemetryClient.getInstance().startAction(telemetryEventName, ActionType.EVENT);
            try {
                await this.authenticateNewUser();
                const filteredProjectName = Utils.filterNonAlphanumeric(message.skillName);
                const skillFolderUri = this.createSkillFolder(message.skillFolder, filteredProjectName);
                const profile = Utils.getCachedProfile(this.extensionContext) ?? DEFAULT_PROFILE;

                await this.createSkillFlow(profile, message, skillFolderUri, message.isHostedSkill);
                await TelemetryClient.getInstance().store(action);

                const skillCreateMsg = `${message.skillName} was successfully created.`;
                Logger.info(skillCreateMsg);
                await vscode.window.showInformationMessage(skillCreateMsg);
            } catch (err) {
                await TelemetryClient.getInstance().store(action, err);
                throw logAskError(`Skill creation failed`, err, true);
            }
        }
    }

    private validateSkillName(skillName: string) {
        const characters = skillName.trim().length;
        const errorMessages: string[] = [];
        //The skill directory name cannot contain non-alphanumeric characters. 
        //The program removes all non-alphanumeric characters from the given skill name to produce the directory name.
        //This function filters the non-alphanumeric characters from the skill name to produce the directory name. 
        //We must have at least one alphanumeric character so the directory name is not empty.
        if (!Utils.filterNonAlphanumeric(skillName)) {
            errorMessages.push('Skill name must have at least one alphanumeric character.');
        }
        if (characters < SKILL.MIN_SKILL_NAME_LENGTH || characters > SKILL.MAX_SKILL_NAME_LENGTH) {
            errorMessages.push(
                `Skill name must be at least ${SKILL.MIN_SKILL_NAME_LENGTH} characters and 
                    less than ${SKILL.MAX_SKILL_NAME_LENGTH} characters.`
            );
        }
        if (errorMessages.length === 0) {
            return;
        }
        let errorMessage = '';
        errorMessages.forEach(error => {
            errorMessage += error + ' ';
        });
        throw errorMessage;
    }

    private createSkillFolder(skillFolder: string, skillName: string): vscode.Uri {
        Logger.verbose(`Calling method: ${this.viewId}.createSkillFolder, args: `, skillFolder, skillName);
        const skillFolderAbsPath = path.join(skillFolder, skillName);

        if (fs.existsSync(skillFolderAbsPath)) {
            void vscode.window.showWarningMessage(
                `Skill folder ${skillFolderAbsPath} already exists. It will be overwritten.`
            );
            fs.rmdirSync(skillFolderAbsPath);
        }

        fs.mkdirSync(skillFolderAbsPath);

        return vscode.Uri.file(skillFolderAbsPath);
    }

    private async createSkillFlow(
        profile: string,
        message: createSkillWebViewType,
        skillFolderUri: vscode.Uri,
        isHostedSkill: boolean
    ): Promise<void> {
        Logger.verbose(
            `Calling method: ${this.viewId}.createNonHostedSkillFlow, args: `,
            profile,
            message,
            skillFolderUri,
            isHostedSkill
        );
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Creating skill.',
                cancellable: false,
            },
            async progress => {
                if (!this.isDisposed()) {
                    this.getPanel().webview.html = this.loader.renderView({
                        name: 'createInProgress',
                        errorMsg: 'Skill creation in progress...',
                    });
                }
                if (isHostedSkill === false) {
                    const createNonHostedSkillManager = new CreateNonHostedSkillManager(
                        this.context,
                        skillFolderUri.fsPath
                    );
                    await createNonHostedSkillManager.createSkill(message, progress);
                } else {
                    const createHostedSkillManager = new CreateHostedSkillManager(this.context, skillFolderUri.fsPath);
                    await createHostedSkillManager.createSkill(message, progress);
                }
                if (!this.isDisposed()) {
                    this.getPanel().webview.html = this.loader.renderView({
                        name: 'createComplete',
                        errorMsg: 'Skill created.',
                    });
                }
                await openWorkspaceFolder(skillFolderUri);
            }
        );
    }

    private async authenticateNewUser(): Promise<void> {
        Logger.verbose(`Calling method: ${this.viewId}.authenticateNewUser`);
        let profile = Utils.getCachedProfile(this.extensionContext);
        profile = profile ?? DEFAULT_PROFILE;
        const vendorId = Utils.resolveVendorId(profile);
        const permission = await SmapiClientFactory.getInstance(
            profile,
            this.extensionContext
        ).getAlexaHostedSkillUserPermissionsV1(vendorId, 'newSkill');
        if (permission.actionUrl !== undefined) {
            this.getPanel().webview.html = this.loader.renderView({
                name: 'authenticateAccount',
                errorMsg: 'Authenticate your account in your browser.',
            });
            await solveCaptcha(vendorId, permission.actionUrl);
        }
    }
}
