import * as vscode from 'vscode';
import { AbstractWebView, Utils } from '../../runtime';
import { ViewLoader } from '../../utils/webViews/viewLoader';
import { Logger } from '../../logger';
import * as path from 'path';
import { getSkillDetailsFromWorkspace } from '../../utils/skillHelper';
import { DEFAULT_PROFILE, ERRORS, SIMULATOR_MESSAGE_TYPE, WEB_VIEW_NAME } from '../../constants';
import { loggableAskError } from '../../exceptions';
import { IViewport } from "apl-suggester";
import * as simulateMessageHelper from '../../utils/simulateMessageHelper';
import { getReplayList, getNewViewPortMessage } from '../../utils/simulateReplayHelper';

export class SimulateSkillWebview extends AbstractWebView {
    private loader: ViewLoader;
    private context: vscode.ExtensionContext;

    constructor(viewTitle: string, viewId: string, context: vscode.ExtensionContext) {
        super(viewTitle, viewId, context);
        this.loader = new ViewLoader(this.extensionContext, WEB_VIEW_NAME.SIMULATE_SKILL, this);
        this.context = context;
    }

    onViewChangeListener(): void {
        Logger.debug(`Calling method: ${this.viewId}.onViewChangeListener`);
        return;
    }

    getHtmlForView(): string {
        Logger.debug(`Calling method: ${this.viewId}.getHtmlForView`);

        const simulateCss: vscode.Uri = this.getWebview().asWebviewUri(
            vscode.Uri.file(
                path.join(
                    this.extensionContext.extensionPath, 'media', 'simulate.css',
                ),
            ));

        const aplRenderUtils: vscode.Uri = this.getWebview().asWebviewUri(
            vscode.Uri.file(
                path.join(
                    this.extensionContext.extensionPath, 'media/previewApl', 'aplRenderUtils.js',
                ),
            ));

        const customJavascript = this.getWebview().asWebviewUri(
            vscode.Uri.file(
                path.join(
                    this.context.extensionPath, "/node_modules/apl-viewhost-web/index.js"))).toString();
        return this.loader.renderView({
            name: WEB_VIEW_NAME.SIMULATE_SKILL,
            js: true,
            args: {
                simulateCss,
                aplRenderUtils,
                customJavascript
            }
        });
    }

    async onReceiveMessageListener(message: Record<string, any>): Promise<void> {
        Logger.debug(`Calling method: ${this.viewId}.onReceiveMessageListener`);

        const skillDetails = getSkillDetailsFromWorkspace(this.extensionContext);
        const skillId: string = skillDetails.skillId;
        const skillName: string = skillDetails.skillName;
        const profile = Utils.getCachedProfile(this.extensionContext) ?? DEFAULT_PROFILE;

        if (message.type === SIMULATOR_MESSAGE_TYPE.SKILL_STATUS) {
            const returnMessage: string | Record<string, any> = await simulateMessageHelper.handleSkillStatusMessageFromWebview(message, profile, skillId, this.extensionContext);
            await this.getWebview().postMessage({
                message: returnMessage,
                type: SIMULATOR_MESSAGE_TYPE.SKILL_STATUS
            });
        }
        else if (message.type === SIMULATOR_MESSAGE_TYPE.LOCALE) {
            const returnMessage: void | Record<string, any> = await simulateMessageHelper.handleLocaleMessageFromWebview(message, profile, skillId, this.extensionContext);
            if (returnMessage !== null) {
                await this.getWebview().postMessage(returnMessage);
            }
        }
        else if (message.type === SIMULATOR_MESSAGE_TYPE.UTTERANCE) {
            const returnMessage = await simulateMessageHelper.handleUtteranceMessageFromWebview(message, profile, skillId, this.extensionContext);
            await this.getWebview().postMessage(returnMessage);
        }
        else if (message.type === SIMULATOR_MESSAGE_TYPE.EXPORT) {
            void simulateMessageHelper.handleExportMessageFromWebview(message, skillId, skillName, this.extensionContext);
        }
        else if (message.type === SIMULATOR_MESSAGE_TYPE.ACTION) {
            simulateMessageHelper.handleActionMessageFromWebview(message, skillId);
        }
        else {
            throw loggableAskError(ERRORS.UNRECOGNIZED_MESSAGE_FROM_WEBVIEW);
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
    async changeViewport(viewport: IViewport): Promise<void> {
        Logger.verbose(`Calling method: ${this.viewId}.changeViewport, args: `, viewport.toString());
        const returnMessage = getNewViewPortMessage(viewport);
        await this.getWebview().postMessage(returnMessage);
    }
}