import * as vscode from 'vscode';
import * as model from 'ask-smapi-model';
import * as path from 'path';

import { AbstractWebView, SmapiClientFactory, Utils } from '../../runtime';
import { ExtensionContext, WebviewPanelOnDidChangeViewStateEvent } from 'vscode';
import { DEFAULT_PROFILE, SKILL_FOLDER } from '../../constants';
import { ViewLoader } from '../../utils/webViews/viewLoader';
import { getSkillDetailsFromWorkspace } from '../../utils/skillHelper';
import { existsSync } from 'fs';
import { loggableAskError } from '../../exceptions';
import { Logger } from '../../logger';

export class ManifestSyncWebview extends AbstractWebView {
    private loader: ViewLoader;
    private wsFolder: vscode.Uri | undefined;

    constructor(viewTitle: string, viewId: string, context: ExtensionContext) {
        super(viewTitle, viewId, context);
        this.loader = new ViewLoader(this.extensionContext, 'manifestSync', this);
    }

    onViewChangeListener(event: WebviewPanelOnDidChangeViewStateEvent): void {
        Logger.debug(`Calling method: ${this.viewId}.onViewChangeListener`);
        return;
    }

    async onReceiveMessageListener(message: any): Promise<void> {
        Logger.debug(`Calling method: ${this.viewId}.onReceiveMessageListener, args: `, message);
        await this.updateManifest();
    }

    getHtmlForView(...args: any[]): string {
        Logger.debug(`Calling method: ${this.viewId}.getHtmlForView`);
        return this.loader.renderView({
            name: 'manifestSync',
            js: true
        });
    }

    showView(wsFolder: vscode.Uri): void {
        Logger.debug(`Calling method: ${this.viewId}.showView`);
        this.wsFolder = wsFolder;
        super.showView();
    }

    private async updateManifest(): Promise<void> {
        Logger.verbose(`Calling method: ${this.viewId}.updateManifest`);
        const skillId = getSkillDetailsFromWorkspace(this.extensionContext).skillId;
        let profile = Utils.getCachedProfile(this.extensionContext);
        profile = profile ?? DEFAULT_PROFILE;
        const smapiClient = SmapiClientFactory.getInstance(profile, this.extensionContext);

        try {
            const skillManifestResponse: model.v1.skill.Manifest.SkillManifestEnvelope = await smapiClient.getSkillManifestV1(
                skillId, 'development');
            const json = JSON.stringify(skillManifestResponse, null, 2);

            if (this.wsFolder) {
                const manifestPath: string = path.join(
                    this.wsFolder.fsPath, SKILL_FOLDER.SKILL_PACKAGE.NAME, 'skill.json');
                const scheme: string = existsSync(manifestPath) ? "file:" : "untitled:";
                const textDoc = await vscode.workspace.openTextDocument(vscode.Uri.parse(scheme + manifestPath));
                const editor = await vscode.window.showTextDocument(textDoc);
                editor.edit(edit => {
                    const firstLine = editor.document.lineAt(0);
                    const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
                    edit.delete(new vscode.Range(firstLine.range.start, lastLine.range.end));
                    edit.insert(new vscode.Position(0, 0), json);
                    textDoc.save();
                    vscode.window.showInformationMessage('Skill manifest downloaded.');
                });
            } else {
                throw new Error("Unable to determine current workspace.");
            }
        } catch (err) {
            if (err.statusCode === 404) {
                vscode.window.showErrorMessage('No existing manifest exists for the skill.');
            }
            throw loggableAskError('Downloading skill manifest', err);
        }
    }
}
