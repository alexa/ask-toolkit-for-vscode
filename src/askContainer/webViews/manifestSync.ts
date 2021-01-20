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

export class ManifestSyncWebview extends AbstractWebView {
    private loader: ViewLoader;
    private wsFolder: vscode.Uri | undefined;

    constructor(viewTitle: string, viewId: string, context: vscode.ExtensionContext) {
        super(viewTitle, viewId, context);
        this.loader = new ViewLoader(this.extensionContext, WEB_VIEW_NAME.MANIFEST_SYNC, this);
    }

    onViewChangeListener(): void {
        Logger.debug(`Calling method: ${this.viewId}.onViewChangeListener`);
        return;
    }

    async onReceiveMessageListener(message: any): Promise<void> {
        Logger.debug(`Calling method: ${this.viewId}.onReceiveMessageListener, args: `, message);
        await this.updateManifest();
    }

    getHtmlForView(): string {
        Logger.debug(`Calling method: ${this.viewId}.getHtmlForView`);
        return this.loader.renderView({
            name: WEB_VIEW_NAME.MANIFEST_SYNC,
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
        try {
            const skillId = getSkillDetailsFromWorkspace(this.extensionContext).skillId;
            let profile = Utils.getCachedProfile(this.extensionContext);
            profile = profile ?? DEFAULT_PROFILE;
            const smapiClient = SmapiClientFactory.getInstance(profile, this.extensionContext);
            const skillManifestResponse: model.v1.skill.Manifest.SkillManifestEnvelope = await smapiClient.getSkillManifestV1(
                skillId, 'development');
            const json = JSON.stringify(skillManifestResponse, null, 2);

            if (this.wsFolder) {
                const { skillPackageAbsPath } = getSkillMetadataSrc(this.wsFolder.fsPath, profile);
                const manifestPath: string = path.join(skillPackageAbsPath, 'skill.json');
                const scheme: string = existsSync(manifestPath) ? "file:" : "untitled:";
                const textDoc = await vscode.workspace.openTextDocument(vscode.Uri.parse(scheme + manifestPath));
                const editor = await vscode.window.showTextDocument(textDoc);
                void editor.edit(edit => {
                    const firstLine = editor.document.lineAt(0);
                    const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
                    edit.delete(new vscode.Range(firstLine.range.start, lastLine.range.end));
                    edit.insert(new vscode.Position(0, 0), json);
                    void textDoc.save();
                    void vscode.window.showInformationMessage('Skill manifest downloaded.');
                });
            } else {
                throw new Error("Unable to determine current workspace.");
            }
        } catch (err) {
            if (err.statusCode === 404) {
                void vscode.window.showErrorMessage('No existing manifest exists for the skill.');
            }
            throw loggableAskError('There was a problem downloading skill manifest', err, true);
        }
    }
}
