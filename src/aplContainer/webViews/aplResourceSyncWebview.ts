import * as vscode from 'vscode';
import * as AdmZip from 'adm-zip';
import * as fs from 'fs';
import * as path from 'path';
import { AbstractWebView, Utils } from '../../runtime';
import { ExtensionContext, WebviewPanelOnDidChangeViewStateEvent } from 'vscode';
import { ViewLoader } from '../../utils/webViews/viewLoader';
import { getSkillDetailsFromWorkspace } from '../../utils/skillHelper';
import { getSkillPkgZipLocation } from '../../utils/skillPackageHelper';
import { APL_DOCUMENT_FILE_PATH, DATASOURCES_FILE_PATH, SOURCES_FILE_PATH, DOCUMENT_PATH_REGEX_RELATIVE_TO_SKILL_PACKAGE, DATASOURCES_PATH_REGEX_RELATIVE_TO_SKILL_PACKAGE, SOURCES_PATH_REGEX_RELATIVE_TO_SKILL_PACKAGE } from '../config/configuration';
import { displayDirRootPath, updateFileContent, readFileContentFromZip } from '../utils/fileHelper';
import { AplResource } from '../models';
import { PROMPT_MESSAGES, SUCCESS_MESSAGES } from '../constants/messages';
import { loggableAskError } from '../../exceptions';
import { Logger } from '../../logger';
import { ERROR_MESSAGES } from '../../../src/aplContainer/constants/messages';
import { DEFAULT_PROFILE } from '../../constants'


export class AplResourceSyncWebview extends AbstractWebView {
    private loader: ViewLoader;
    private wsFolder: vscode.Uri;
    private aplResourceMap: Map<string, AplResource> | undefined;
    private aplResourceNames: string[] | undefined;

    constructor(viewTitle: string, viewId: string, context: ExtensionContext, wsFolder: vscode.Uri) {
        super(viewTitle, viewId, context);
        this.loader = new ViewLoader(this.extensionContext, 'aplResourceSync', this);
        this.wsFolder = wsFolder;
    }

    onViewChangeListener(event: WebviewPanelOnDidChangeViewStateEvent): void {
        throw new Error('Method not implemented.');
    }

    async onReceiveMessageListener(message: any): Promise<void> {
        Logger.debug(`Calling method: ${this.viewId}.onReceiveMessageListener`);
        if (message.action === 'retrieve') {
            await this.retrieveAplResources();
            this.getPanel().webview.postMessage({ names: this.aplResourceNames });
        } else if (message.action === 'sync' && message.name) {
            await this.updateAplResource(message.name);
        }
    }

    getHtmlForView(...args: any[]): string {
        Logger.debug(`Calling method: ${this.viewId}.getHtmlForView`);
        return this.loader.renderView({
            name: 'aplResourceSync',
            js: true
        });
    }

    async retrieveAplResources(): Promise<void> {
        Logger.verbose(`Calling method: ${this.viewId}.retrieveAplResources`);
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: PROMPT_MESSAGES.SYNC_APL_RESOURCE_RETRIEVING_INFORMATION,
            cancellable: true
        }, async (_progress) => {
            const skillId: string = getSkillDetailsFromWorkspace(this.extensionContext)?.skillId;
            const skillPkgZipLocation : string = await getSkillPkgZipLocation(
                this.wsFolder.fsPath, skillId, this.extensionContext);
            const skillPackageZip: AdmZip = new AdmZip(skillPkgZipLocation);
    
            let aplResourceNames: string[] = [];
            let aplResourceMap: Map<string, AplResource> = new Map();

            skillPackageZip.getEntries().forEach((entry) => {
                if (entry.isDirectory) {
                    return;
                } 
                const entryName: string = entry.entryName;
                if (DOCUMENT_PATH_REGEX_RELATIVE_TO_SKILL_PACKAGE.test(entryName)) {
                    // updated upon regexp change
                    const resourceName: string = entryName.match(DOCUMENT_PATH_REGEX_RELATIVE_TO_SKILL_PACKAGE)![3];
                    aplResourceNames.push(resourceName);
                    const document: string | null = this.getResourceFromZip(entryName, skillPackageZip);
                    aplResourceMap.set(resourceName, { document } as AplResource);
                } else if (DATASOURCES_PATH_REGEX_RELATIVE_TO_SKILL_PACKAGE.test(entryName)) {
                    const resourceName: string = entryName.match(DATASOURCES_PATH_REGEX_RELATIVE_TO_SKILL_PACKAGE)![3];
                    if (aplResourceMap.has(resourceName)) {
                        const datasources: string | null = this.getResourceFromZip(entryName, skillPackageZip);
                        aplResourceMap.set(resourceName, { ...aplResourceMap.get(resourceName), datasources } as AplResource);
                    }
                } else if (SOURCES_PATH_REGEX_RELATIVE_TO_SKILL_PACKAGE.test(entryName)) {
                    const resourceName: string = entryName.match(SOURCES_PATH_REGEX_RELATIVE_TO_SKILL_PACKAGE)![3];
                    if (aplResourceMap.has(resourceName)) {
                        const sources: string | null = this.getResourceFromZip(entryName, skillPackageZip);
                        aplResourceMap.set(resourceName, { ...aplResourceMap.get(resourceName), sources } as AplResource);
                    }
                }
            });
     
            this.aplResourceMap = aplResourceMap;
            this.aplResourceNames = aplResourceNames;
    
            // remove skill package zip
            fs.unlinkSync(skillPkgZipLocation);     
        });   
        
        if (this.aplResourceNames && !this.aplResourceNames.length) {
            await vscode.window.showInformationMessage(PROMPT_MESSAGES.SYNC_APL_RESOURCE_NO_RESOURCE_FOUND_IN_CONSOLE);
        }
    }

    getResourceFromZip(entryName: string, skillPackageZip: AdmZip): string | null {
        Logger.verbose(`Calling method: ${this.viewId}.getResourceFromZip, args:`, entryName);

        if (!skillPackageZip) {
            throw loggableAskError(ERROR_MESSAGES.NO_SKILL_PACKAGE_FOUND, undefined, true);
        }
     
        return readFileContentFromZip(skillPackageZip, entryName);
    }

    async updateAplResource(name: string): Promise<void> {
        Logger.verbose(`Calling method: ${this.viewId}.updateAplResource, args:`, name);
        if (this.aplResourceMap && this.aplResourceMap.has(name)) {
            const sources: string | undefined = this.aplResourceMap.get(name)!.sources;
            const profile = Utils.getCachedProfile(this.extensionContext) ?? DEFAULT_PROFILE;
            if (sources) {
                const sourcesPath: string = path.join(this.wsFolder.fsPath, displayDirRootPath(this.wsFolder.fsPath, profile), name, SOURCES_FILE_PATH);
                await updateFileContent(sourcesPath, sources);
            } 

            const datasources: string | undefined = this.aplResourceMap.get(name)!.datasources;
            if (datasources) {
                const dataSourcePath: string = path.join(this.wsFolder.fsPath, displayDirRootPath(this.wsFolder.fsPath, profile), name, DATASOURCES_FILE_PATH);
                await updateFileContent(dataSourcePath, datasources);
            }

            const document: string = this.aplResourceMap.get(name)!.document;
            const documentPath: string = path.join(this.wsFolder.fsPath, displayDirRootPath(this.wsFolder.fsPath, profile), name, APL_DOCUMENT_FILE_PATH);
            await updateFileContent(documentPath, document);  
            vscode.window.showInformationMessage(SUCCESS_MESSAGES.SYNC_APL_RESOURCE_SUCCESS);
        }
    }
}
