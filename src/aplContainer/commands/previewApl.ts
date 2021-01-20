import { AbstractCommand, CommandContext, Utils } from '../../runtime';
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { EXTENSION_COMMAND_CONFIG, APL_DOCUMENT_FILE_PATH, DATASOURCES_FILE_PATH, SOURCES_FILE_PATH } from '../config/configuration';
import { AplPreviewWebView } from '../webViews/aplPreviewWebView';
import { ERROR_MESSAGES, PROMPT_MESSAGES } from '../constants/messages';
import { displayDirRootPath } from '../utils/fileHelper';
import { loggableAskError } from '../../exceptions';
import { getSkillFolderInWs } from '../../utils/workspaceHelper';
import { DEFAULT_PROFILE } from '../../constants'
export class PreviewAplCommand extends AbstractCommand<void> {
    private aplPreviewWebView;

    constructor(webView: AplPreviewWebView) {
        super(EXTENSION_COMMAND_CONFIG.RENDER_APL_DOCUMENT.NAME);
        this.aplPreviewWebView = webView;
    }

    async execute(context: CommandContext, skillFolderWs: vscode.Uri): Promise<void> {
        const wsFolder = skillFolderWs ? skillFolderWs : getSkillFolderInWs(context.extensionContext) as vscode.Uri;
        if (!wsFolder.fsPath.endsWith('.json')) {
            const profile = Utils.getCachedProfile(context.extensionContext) ?? DEFAULT_PROFILE;
            const aplResourceRootPath: string = path.join(wsFolder.fsPath, displayDirRootPath(skillFolderWs.fsPath, profile));
            const aplResourceNames : string[] = await this.getAplResourceNames(aplResourceRootPath);
            const pickAplResource: vscode.QuickPickItem | undefined = await vscode.window.showQuickPick(
                this.getAplResourceOptions(aplResourceNames)
            );
            if (!pickAplResource) {
                return;
            }

            const viewColumn: vscode.ViewColumn = this.getViewColumn(this.aplPreviewWebView.getPanel());
            await this.openAplResourceInTextEditor(aplResourceRootPath, pickAplResource.label, viewColumn);
        }
        // create web view panel or revive it
        this.aplPreviewWebView.showView();
    }

    /**
     * Function to get APL resource names, which will be read from the directory name under display folder
     * 
     * @private
     * @param {string} parentDirectory - parenet directory to read from
     * @returns {string[]} 
     * 
     * @memberOf PreviewAplCommand
     */
    private async getAplResourceNames(parentDirectory: string): Promise<string[]> {
        let dirs: fs.Dirent[] = [];
        try {
            dirs = fs.readdirSync(parentDirectory, { withFileTypes: true });
        } catch(err) {
            await vscode.window.showInformationMessage(PROMPT_MESSAGES.PREVIEW_APL_NO_APL_FOUND_IN_DIRECTORY);
            throw loggableAskError(PROMPT_MESSAGES.PREVIEW_APL_NO_APL_FOUND_IN_DIRECTORY);
        }
        return dirs.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
    }

     /**
     * Function to open both APL document and datasources in text editor with the given resource identifier
     * 
     * @private
     * @param {string} aplResourceRootPath - APL resource root path
     * @param {string} pickAplResourceIdentifier - resource identifier picked
     * @returns {Promise<void>} 
     * 
     * @memberOf PreviewAplCommand
     */
    private async openAplResourceInTextEditor(aplResourceRootPath: string, pickAplResourceIdentifier: string, viewColumn?: vscode.ViewColumn): Promise<void> {
        const aplDocumentPath: string = path.join(aplResourceRootPath, pickAplResourceIdentifier, APL_DOCUMENT_FILE_PATH);
        const datasourcesPath: string = path.join(aplResourceRootPath, pickAplResourceIdentifier, DATASOURCES_FILE_PATH);
        const sourcesPath: string = path.join(aplResourceRootPath, pickAplResourceIdentifier, SOURCES_FILE_PATH);
        if (fs.existsSync(datasourcesPath)) {
            await vscode.window.showTextDocument(vscode.Uri.file(datasourcesPath), {preview: false, viewColumn} as vscode.TextDocumentShowOptions);
        } 
        if (fs.existsSync(sourcesPath)) {
            await vscode.window.showTextDocument(vscode.Uri.file(datasourcesPath), {preview: false, viewColumn} as vscode.TextDocumentShowOptions);
        }      
        if (fs.existsSync(aplDocumentPath)) {
            await vscode.window.showTextDocument(vscode.Uri.file(aplDocumentPath), {preview: false, viewColumn} as vscode.TextDocumentShowOptions);
        } else {
            throw loggableAskError(ERROR_MESSAGES.PREVIEW_APL_NO_APL_DOCUMENT_FOUND, undefined, true);
        }
    }

    /**
     * Function to generate APL resource name options
     *
     * @private
     * @returns {vscode.QuickPickItem[]}
     *
     * @memberOf PreviewAplCommand
     */
    private getAplResourceOptions(aplResourceDirs: string[]): vscode.QuickPickItem[] {
        return aplResourceDirs
            .map(
                resource =>
                    ({
                        label: resource,
                        description: `Preview ${resource}`,
                    } as vscode.QuickPickItem)
            );
    }

    /**
     * Function to determine which view column should be used to open APL document and datasources files
     * @param panel - APL preview web view panel
     * @returns {vscode.ViewColumn}
     * 
     * @memberOf PreviewAplCommand
     */
    private getViewColumn(panel: vscode.WebviewPanel): vscode.ViewColumn {
        try {
            if (panel && panel.visible) {
                return panel.viewColumn ? panel.viewColumn - 1 : vscode.ViewColumn.One; 
            } else {
                // no panel 
                const activeTextEditor = vscode.window.activeTextEditor;
                return activeTextEditor && activeTextEditor.viewColumn ? activeTextEditor.viewColumn : vscode.ViewColumn.One;  
            }
        } catch(err) {
            // panel is disposed
            const activeTextEditor = vscode.window.activeTextEditor;
            return activeTextEditor && activeTextEditor.viewColumn ? activeTextEditor.viewColumn : vscode.ViewColumn.One;
        }
    }
}