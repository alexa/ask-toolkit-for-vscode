import * as vscode from 'vscode';
import * as model from 'ask-smapi-model';
import * as path from 'path';

import { AbstractWebView, SmapiClientFactory, Utils } from '../../runtime';
import { DEFAULT_PROFILE, SKILL_FOLDER, WEB_VIEW_NAME } from '../../constants';
import { ViewLoader } from '../../utils/webViews/viewLoader';
import { getSkillDetailsFromWorkspace, getSkillMetadataSrc } from '../../utils/skillHelper';
import { existsSync } from 'fs';
import { loggableAskError } from '../../exceptions';
import { Logger } from '../../logger';

export class InteractionModelSyncWebview extends AbstractWebView {
    private loader: ViewLoader;
    private wsFolder: vscode.Uri | undefined;

    constructor(viewTitle: string, viewId: string, context: vscode.ExtensionContext) {
        super(viewTitle, viewId, context);
        this.loader = new ViewLoader(this.extensionContext, WEB_VIEW_NAME.INTERACTION_MODEL_SYNC, this);
    }

    onViewChangeListener(): void {
        Logger.debug(`Calling method: ${this.viewId}.onViewChangeListener`);

        return;
    }

    async onReceiveMessageListener(message: any): Promise<void> {
        Logger.debug(`Calling method: ${this.viewId}.onReceiveMessageListener, args: `, message);
        if (message.locale !== undefined) {
            await this.updateInteractionModel(message.locale);
        }
    }

    getHtmlForView(): string {
        Logger.debug(`Calling method: ${this.viewId}.getHtmlForView`);
        return this.loader.renderView({
            name: WEB_VIEW_NAME.INTERACTION_MODEL_SYNC,
            js: true
        });
    }

    showView(wsFolder: vscode.Uri): void {
        Logger.debug(`Calling method: ${this.viewId}.showView`);
        this.wsFolder = wsFolder;
        super.showView();
    }

    private async updateInteractionModel(locale: string): Promise<void> {
        Logger.verbose(`Calling method: ${this.viewId}.updateInteractionModel, args: `, locale);
        try {
            const skillId = getSkillDetailsFromWorkspace(this.extensionContext).skillId;
            let profile = Utils.getCachedProfile(this.extensionContext);
            profile = profile ?? DEFAULT_PROFILE;
            const smapiClient = SmapiClientFactory.getInstance(profile, this.extensionContext);
            const interactionModelResponse: model.v1.skill.interactionModel.InteractionModelData = await smapiClient.getInteractionModelV1(
                skillId, 'development', locale);
            const json = JSON.stringify(interactionModelResponse, null, 2);

            if (this.wsFolder) {
                const { skillPackageAbsPath } = getSkillMetadataSrc(this.wsFolder.fsPath, profile);
                const iModelPath: string = path.join(skillPackageAbsPath, SKILL_FOLDER.SKILL_PACKAGE.CUSTOM_MODELS, `${locale}.json`);
                const scheme: string = existsSync(iModelPath) ? "file:" : "untitled:";
                const textDoc = await vscode.workspace.openTextDocument(vscode.Uri.parse(scheme + iModelPath));
                const editor = await vscode.window.showTextDocument(textDoc);
                void editor.edit(edit => {
                    const firstLine = editor.document.lineAt(0);
                    const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
                    edit.delete(new vscode.Range(firstLine.range.start, lastLine.range.end));
                    edit.insert(new vscode.Position(0, 0), json);
                    void textDoc.save();
                    void vscode.window.showInformationMessage('Interaction model downloaded.');
                });
            } else {
                throw new Error("Unable to determine current workspace.");
            }
        } catch (err) {
            if (err.statusCode === 404) {
                void vscode.window.showErrorMessage(`There is no interaction model for ${locale}. Select a different locale.`);
            }
            throw loggableAskError('There was a problem downloading the interaction model. Try the download again.', err, true);
        }
    }
}
