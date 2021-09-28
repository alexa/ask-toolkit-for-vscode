/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/

import { IViewport } from "apl-suggester";
import * as path from 'path';
import * as vscode from 'vscode';
import { DEFAULT_PROFILE, ERRORS, EXTENSION_STATE_KEY, SIMULATOR_MESSAGE_TYPE, WEB_VIEW_NAME } from '../../constants';
import { logAskError } from '../../exceptions';
import { Logger } from '../../logger';
import { AbstractWebView, Utils } from '../../runtime';
import { AVSClient } from '../../utils/avs/avsClient';
import { deleteRegisteredDevice, getRegisteredDeviceId, readDeviceToken } from '../../utils/avs/deviceTokenUtil';
import { callAvsForAplUserEvent } from '../../utils/avs/simulateAVSHelper';
import * as simulateMessageHelper from '../../utils/simulateMessageHelper';
import { getNewViewPortMessage, getReplayList } from '../../utils/simulateReplayHelper';
import { getSkillDetailsFromWorkspace } from '../../utils/skillHelper';
import { ViewLoader } from '../../utils/webViews/viewLoader';
import { onDeviceDeletionEventEmitter, onDeviceRegistrationEventEmitter } from '../events';
import { DEVICE_EXPIRY_TIME } from './deviceRegistryWebview';

let simulateCss: vscode.Uri;
let aplRenderUtils: vscode.Uri;
let customJavascript;

export class SimulateSkillWebview extends AbstractWebView {
    private loader: ViewLoader;
    private context: vscode.ExtensionContext;
    //Access to SMAPI mode when 'isAVSMode' is false, access to AVS mode when it is true.
    private isAVSMode: boolean;

    constructor(viewTitle: string, viewId: string, context: vscode.ExtensionContext) {
        super(viewTitle, viewId, context);
        this.loader = new ViewLoader(this.extensionContext, WEB_VIEW_NAME.SIMULATE_SKILL, this);
        this.context = context;
        this.shouldPersist = true;
        this.isAVSMode = false;
        onDeviceRegistrationEventEmitter.event(() => {
            this.refresh();
        });
        onDeviceDeletionEventEmitter.event(() => {
            this.refresh();
        });
    }

    onViewChangeListener(): void {
        Logger.debug(`Calling method: ${this.viewId}.onViewChangeListener`);
        return;
    }

    getHtmlForView(): string {
        Logger.debug(`Calling method: ${this.viewId}.getHtmlForView`);
        void this.checkSimulatorMode();
        simulateCss = this.getWebview().asWebviewUri(
            vscode.Uri.file(
                path.join(
                    this.extensionContext.extensionPath, 'media', 'simulate.css',
                ),
            ));
        aplRenderUtils = this.getWebview().asWebviewUri(
            vscode.Uri.file(
                path.join(
                    this.extensionContext.extensionPath, 'media/previewApl', 'aplRenderUtils.js',
                ),
            ));
        customJavascript = this.getWebview().asWebviewUri(
            vscode.Uri.file(
                path.join(
                    this.context.extensionPath, "/node_modules/apl-viewhost-web/index.js"))).toString();
        return this.loader.renderView({
            name: WEB_VIEW_NAME.SIMULATE_SKILL,
            js: true,
            args: {
                simulateCss,
                aplRenderUtils,
                customJavascript,
                isAVSMode: this.isAVSMode,
            }
        });
    }

    public refresh(): void {
        Logger.debug(`Calling method: ${this.viewId}.refresh`);
        // Close the panel, to refresh the content
        if (!this.isDisposed()) {
            this.dispose();
        }
        // Recreate the panel and show the content
        this.showView();
    }

    async onReceiveMessageListener(message: Record<string, any>): Promise<void> {
        Logger.debug(`Calling method: ${this.viewId}.onReceiveMessageListener`);

        const skillDetails = getSkillDetailsFromWorkspace(this.extensionContext);
        const skillId: string = skillDetails.skillId;
        const skillName: string = skillDetails.skillName;
        const profile = Utils.getCachedProfile(this.extensionContext) ?? DEFAULT_PROFILE;
        switch (message.type) {

            case SIMULATOR_MESSAGE_TYPE.SKILL_STATUS: {
                const returnMessage: string | Record<string, any> = await simulateMessageHelper.handleSkillStatusMessageFromWebview(message, profile, skillId, this.extensionContext);
                await this.getWebview().postMessage({
                    status: returnMessage,
                    type: SIMULATOR_MESSAGE_TYPE.SKILL_STATUS
                });
                break;
            }
            case SIMULATOR_MESSAGE_TYPE.LOCALE: {
                const returnMessage: void | Record<string, any> = await simulateMessageHelper.handleLocaleMessageFromWebview(message, profile, skillId, this.extensionContext, this.isAVSMode);
                if (returnMessage !== null) {
                    await this.getWebview().postMessage(returnMessage);
                }
                break;
            }
            case SIMULATOR_MESSAGE_TYPE.UTTERANCE: {
                const returnMessage = await simulateMessageHelper.handleUtteranceMessageFromWebview(message, profile, skillId, this.extensionContext, this.isAVSMode);
                await this.getWebview().postMessage(returnMessage);
                break;
            }
            case SIMULATOR_MESSAGE_TYPE.EXPORT:
                void simulateMessageHelper.handleExportMessageFromWebview(message, skillId, skillName, this.extensionContext);
                break;

            case SIMULATOR_MESSAGE_TYPE.DEVICE_WEBVIEW:
                simulateMessageHelper.handleActionMessageFromWebview(message, skillId, this.isAVSMode);
                break;

            case SIMULATOR_MESSAGE_TYPE.USEREVENT: {
                if (!this.isAVSMode) {
                    Logger.debug("It's not in AVS mode and the user_event is ignored.");
                    return;
                }
                const returnMessage = await callAvsForAplUserEvent(message.userEvent, this.extensionContext);
                await this.getWebview().postMessage(returnMessage);
                break;
            }
            default:
                throw logAskError(ERRORS.UNRECOGNIZED_MESSAGE_FROM_WEBVIEW);
        }
    }

    async replaySessionInSimulator(): Promise<void> {
        Logger.debug(`Calling method: ${this.viewId}.replaySessionInSimulator`);
        const returnMessage = await getReplayList();
        if (returnMessage !== null) {
            await this.getWebview().postMessage(returnMessage);
        }
    }

    //Get the document/datasource/new_viewport to change the preview.
    async changeViewport(viewport: IViewport, pickedViewportName: string): Promise<void> {
        Logger.verbose(`Calling method: ${this.viewId}.changeViewport, args: `, viewport.toString());
        const returnMessage = getNewViewPortMessage(viewport, pickedViewportName, this.isAVSMode);
        await this.getWebview().postMessage(returnMessage);
    }

    private async checkSimulatorMode() {
        Logger.debug(`Calling method: ${this.viewId}.checkSimulatorMode`);
        const hasValidDevice = await this.context.secrets.get(EXTENSION_STATE_KEY.REGISTERED_DEVICE.VALID_DEVICE);
        this.isAVSMode = (hasValidDevice === 'true');
        if (this.isAVSMode) {
            if (this.isRegistrationExpired()) {
                await this.reauthorizeDevice();
            } else {
                try {
                    const accessToken = await readDeviceToken(this.extensionContext);
                    const region = await this.context.secrets.get(EXTENSION_STATE_KEY.REGISTERED_DEVICE.REGION);
                    //Fallback happens if cannot get valid token.
                    const isValidToken: boolean = await AVSClient.getInstance(accessToken, this.extensionContext, region).sendPing();
                    if (!isValidToken) {
                        this.isAVSMode = false;
                        throw logAskError('Failed to ping AVS with the device token: ', accessToken);
                    }
                } catch (err) {
                    this.isAVSMode = false;
                    throw logAskError(err);
                }
            }
        }
        this.getPanel().webview.html = this.loader.renderView({
            name: WEB_VIEW_NAME.SIMULATE_SKILL,
            js: true,
            args: {
                simulateCss,
                aplRenderUtils,
                customJavascript,
                isAVSMode: this.isAVSMode,
            }
        });
    }

    private isRegistrationExpired() {
        Logger.debug(`Calling method: ${this.viewId}.isRegistrationExpired`);
        const expiryTime: any = this.context.globalState.get(EXTENSION_STATE_KEY.REGISTERED_DEVICE.DEVICE_EXPIRY_TIME);
        if (expiryTime === undefined) {
            Logger.debug('The expiryTime is undefined.');
            return true;
        }
        if (expiryTime === DEVICE_EXPIRY_TIME.INDEFINITELY) {
            return false;
        }
        const currentTime = new Date().toISOString();
        if (Date.parse(currentTime) > Date.parse(expiryTime)) {
            Logger.debug('The device is expired by: ', expiryTime);
            return true;
        } else {
            return false;
        }
    }
    private async reauthorizeDevice() {
        Logger.debug(`Calling method: ${this.viewId}.reauthorizeDevice`);
        const registeredDeviceId = await getRegisteredDeviceId(this.context);
        if (registeredDeviceId && registeredDeviceId !== null) {
            const confirmAuth = 'Yes';
            const option = await vscode.window.showErrorMessage(
                ERRORS.CREDENTIAL_EXPIRED(registeredDeviceId), { modal: true }, confirmAuth);

            if (option === confirmAuth) {
                Logger.verbose('Confirmed device reauthorization.');
                await vscode.commands.executeCommand('askContainer.skillsConsole.deviceRegistry');
            } else {
                Logger.verbose('Cancelled device reauthorization. Fallabck to SMAPI mode.');
                this.isAVSMode = false;
                await this.extensionContext.globalState.update(
                    EXTENSION_STATE_KEY.REGISTERED_DEVICE.VALID_DEVICE, 'false');
                await deleteRegisteredDevice(registeredDeviceId, this.extensionContext);
                onDeviceDeletionEventEmitter.fire(registeredDeviceId);
            }
        } else {
            void vscode.window.showInformationMessage(ERRORS.NO_DEVICES_REGISTERED);
        }
    }
}