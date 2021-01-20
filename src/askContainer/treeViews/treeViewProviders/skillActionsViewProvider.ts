import * as vscode from 'vscode';
import {
    PluginTreeItem, Resource, CustomResource, ContextValueTypes, Utils
} from '../../../runtime';

import { 
    getSkillDetailsFromWorkspace, SkillDetailsType, getHostedSkillMetadata 
} from '../../../utils/skillHelper';
import { EN_US_LOCALE, SKILL_ACTION_URLS, SKILL_ACTION_ITEMS, SKILL_NOT_DEPLOYED_MSG
} from '../../../constants';
import { onWorkspaceOpenEventEmitter } from '../../events';
import { SkillActionsView } from '../skillActionsView';
import { Logger } from '../../../logger';
import { getSkillFolderInWs } from '../../../utils/workspaceHelper';
import { EXTENSION_COMMAND_CONFIG } from '../../../aplContainer/config/configuration';

function getIModelGeneratorLink(skillId: string, locale?: string): string {
    Logger.verbose(`Calling method: ${SkillActionsViewProvider.name}.getIModelGeneratorLink`);
    locale = locale ?? EN_US_LOCALE.replace('-', '_');
    return SKILL_ACTION_URLS.IMODEL_EDITOR(skillId, locale);
}

export class SkillActionsViewProvider implements vscode.TreeDataProvider<PluginTreeItem<Resource>> {
    readonly onDidChangeTreeData = onWorkspaceOpenEventEmitter.event;
    readonly treeView: SkillActionsView;

    constructor(view: SkillActionsView) {
        this.treeView = view;
    }

    getTreeItem(element: PluginTreeItem<Resource>): vscode.TreeItem | Thenable<vscode.TreeItem> {
        Logger.debug(`Calling method: ${SkillActionsViewProvider.name}.getTreeItem`);
        return element;
    }

    async getChildren(element?: PluginTreeItem<Resource>): Promise<Array<PluginTreeItem<Resource>>> {
        Logger.debug(`Calling method: ${SkillActionsViewProvider.name}.getChildren`);
        const treeItems: Array<PluginTreeItem<Resource>> = [];
        const skillFolder = getSkillFolderInWs(this.treeView.extensionContext);
        if(skillFolder) {
            const skillDetails = getSkillDetailsFromWorkspace(this.treeView.extensionContext);
            const skillName: string = skillDetails.skillName;
            const skillId: string = skillDetails.skillId;

            if (!element) {
                if (!Utils.isNonBlankString(skillId)) {
                    Logger.info(SKILL_NOT_DEPLOYED_MSG);
                    void vscode.window.showWarningMessage(SKILL_NOT_DEPLOYED_MSG);
                }

                treeItems.push(
                    new PluginTreeItem<Resource>(
                        skillName, null,
                        vscode.TreeItemCollapsibleState.Expanded,
                        undefined, undefined,
                        ContextValueTypes.SKILL,
                    ),
                );
            } else if (element.label === skillName) {
                await this.addSkillActionResources(treeItems, skillDetails);
            } else if (element.label === SKILL_ACTION_ITEMS.MANIFEST.LABEL) {
                this.addManifestResources(treeItems, skillFolder);
            } else if (element.label === SKILL_ACTION_ITEMS.IM.LABEL) {
                this.addIModelResources(treeItems, skillFolder, skillDetails);
            } else if (element.label === SKILL_ACTION_ITEMS.ALEXA_PRESENTATION_LANGUAGE.LABEL) {
                this.addAplRendererResources(treeItems, skillFolder, skillDetails);
            } else if (element.label === SKILL_ACTION_ITEMS.TEST.LABEL) {
                this.addTestResources(treeItems, skillFolder, skillDetails);
            }
        } else {
            Logger.error(`Method: ${SkillActionsViewProvider.name}.getChildren failure`);
            // This view should technically be invisible
            // But instead of setting the context, adding a view item to select a skill
            treeItems.push(
                new PluginTreeItem<CustomResource>(
                    'Select a skill', null,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        title: 'openWorkspace',
                        command: 'ask.container.openWorkspace',
                    }, undefined,
                    ContextValueTypes.SKILL,
                ),
            );
        }
        return treeItems;
    }

    /**
     * Function to add skill actions under skill tree item
     * 
     * @private
     * @param {Array<PluginTreeItem<Resource>>} treeItemsArray - tree items
     * @param {SkillDetailsType} skillDetails - Skill information
     * @returns {Array<PluginTreeItem<Resource>>} - updated tree items
     * 
     * @memberOf SkillActionsViewProvider
     */
    private async addSkillActionResources(
        treeItemsArray: Array<PluginTreeItem<Resource>>, 
        skillDetails: SkillDetailsType): Promise<Array<PluginTreeItem<Resource>>> {
        const skillId: string = skillDetails.skillId;
        
        if (Utils.isNonBlankString(skillId)) {
            treeItemsArray.push(
                new PluginTreeItem<Resource>(
                    SKILL_ACTION_ITEMS.MANIFEST.LABEL, null,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    undefined, undefined,
                    ContextValueTypes.SKILL,
                ),
            );

            treeItemsArray.push(
                new PluginTreeItem<Resource>(
                    SKILL_ACTION_ITEMS.IM.LABEL, null,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    undefined, undefined,
                    ContextValueTypes.SKILL,
                ),
            );
        }
    
        treeItemsArray.push(
            new PluginTreeItem<Resource>(
                SKILL_ACTION_ITEMS.ALEXA_PRESENTATION_LANGUAGE.LABEL, null,
                vscode.TreeItemCollapsibleState.Collapsed,
                undefined, undefined,
                ContextValueTypes.SKILL,
            ),
        );
        
        if (Utils.isNonBlankString(skillId)) {
            const hostedMetadata = await getHostedSkillMetadata(skillId, this.treeView.extensionContext);
            if (hostedMetadata !== undefined) {
                treeItemsArray.push(
                    new PluginTreeItem<Resource>(
                        SKILL_ACTION_ITEMS.DEPLOY.LABEL, null,
                        vscode.TreeItemCollapsibleState.None,
                        {
                            title: 'deployHostedSkill',
                            command: 'askContainer.skillsConsole.deployHostedSkill'
                        }, undefined,
                        ContextValueTypes.SKILL,
                    ),
                );
            } else {
                treeItemsArray.push(
                    new PluginTreeItem<Resource>(
                        SKILL_ACTION_ITEMS.DEPLOY.LABEL, null,
                        vscode.TreeItemCollapsibleState.None,
                        {
                            title: 'deployNonHostedSkill',
                            command: 'askContainer.skillsConsole.deploySelfHostedSkill'
                        }, undefined,
                        ContextValueTypes.SKILL,
                    ),
                );
            } 
            
            treeItemsArray.push(
                new PluginTreeItem<Resource>(
                    SKILL_ACTION_ITEMS.TEST.LABEL, null,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    undefined, undefined,
                    ContextValueTypes.SKILL,
                ),
            );
           
        }
        return treeItemsArray;
    }

    /**
     * Function to add APL related actions into Skill Actions treeview under 'APL renderer' tree item
     * 
     * @private
     * @param {Array<PluginTreeItem<Resource>>} resourceArray - tree items
     * @returns {Array<PluginTreeItem<Resource>>} - updated tree items
     * 
     * @memberOf SkillActionsViewProvider
     */
    private addAplRendererResources(
        resourceArray: Array<PluginTreeItem<Resource>>, skillFolder: vscode.Uri,  
        skillDetails: SkillDetailsType): Array<PluginTreeItem<Resource>> {
        const skillId: string = skillDetails.skillId;

        resourceArray.push(
            new PluginTreeItem<Resource>(
                SKILL_ACTION_ITEMS.ALEXA_PRESENTATION_LANGUAGE.ITEMS.CREATE_APL_DOCUMENT.LABEL, null,
                vscode.TreeItemCollapsibleState.None,
                {
                    title: EXTENSION_COMMAND_CONFIG.CREATE_APL_DOCUMENT_FROM_SAMPLE.TITLE,
                    command: EXTENSION_COMMAND_CONFIG.CREATE_APL_DOCUMENT_FROM_SAMPLE.NAME,
                    arguments: [skillFolder]
                }, undefined,
                ContextValueTypes.SKILL,
            ),
        );

        resourceArray.push(
            new PluginTreeItem<Resource>(
                SKILL_ACTION_ITEMS.ALEXA_PRESENTATION_LANGUAGE.ITEMS.PREVIEW_APL_DOCUMENT.LABEL, null,
                vscode.TreeItemCollapsibleState.None,
                {
                    title: EXTENSION_COMMAND_CONFIG.RENDER_APL_DOCUMENT.TITLE,
                    command: EXTENSION_COMMAND_CONFIG.RENDER_APL_DOCUMENT.NAME,
                    arguments: [skillFolder]
                }, undefined,
                ContextValueTypes.SKILL,
            ),
        );

        resourceArray.push(
            new PluginTreeItem<Resource>(
                SKILL_ACTION_ITEMS.ALEXA_PRESENTATION_LANGUAGE.ITEMS.CHANGE_VIEWPORT_PROFILE.LABEL, null,
                vscode.TreeItemCollapsibleState.None,
                {
                    title: EXTENSION_COMMAND_CONFIG.CHANGE_VIEWPORT_PROFILE.TITLE,
                    command: EXTENSION_COMMAND_CONFIG.CHANGE_VIEWPORT_PROFILE.NAME
                }, undefined,
                ContextValueTypes.SKILL,
            ),
        );
        
        if (Utils.isNonBlankString(skillId)) {
            resourceArray.push(
                new PluginTreeItem<Resource>(
                    SKILL_ACTION_ITEMS.ALEXA_PRESENTATION_LANGUAGE.ITEMS.DOWNLOAD_APL_DOCUMENT.LABEL, null,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        title: EXTENSION_COMMAND_CONFIG.DOWNLOAD_APL_DOCUMENT.TITLE,
                        command: EXTENSION_COMMAND_CONFIG.DOWNLOAD_APL_DOCUMENT.NAME,
                        arguments: [skillFolder]
                    }, undefined,
                    ContextValueTypes.SKILL,
                ),
            );
        }

        return resourceArray;
    }

        /**
     * Function to add manifest related actions into Skill Actions treeview under 'Manifest' tree item
     *
     * @private
     * @param {Array<PluginTreeItem<Resource>>} treeItemsArray - tree items
     * @param {vscode.Uri} skillFolder - Skill folder URI
     * @param {SkillDetailsType} skillDetails - Skill information
     * @returns {Array<PluginTreeItem<Resource>>} - updated tree items for manifest dropdown
     *
     * @memberOf SkillActionsViewProvider
     */
    private addManifestResources(
        treeItemsArray: Array<PluginTreeItem<Resource>>, 
        skillFolder: vscode.Uri): Array<PluginTreeItem<Resource>> {
        Logger.verbose(`Calling method: ${SkillActionsViewProvider.name}.addManifestResources`);

        treeItemsArray.push(
            new PluginTreeItem<Resource>(
                SKILL_ACTION_ITEMS.MANIFEST.ITEMS.DOWNLOAD, null,
                vscode.TreeItemCollapsibleState.None,
                {
                    title: 'syncManifest',
                    command: 'ask.container.syncManifest',
                    arguments: [skillFolder]
                }, undefined,
                ContextValueTypes.SKILL,
            ),
        );

        return treeItemsArray;
    }

    /**
     * Function to add IModel related actions into Skill Actions treeview under 'Interaction Model' tree item
     * 
     * @private
     * @param {Array<PluginTreeItem<Resource>>} treeItemsArray - tree items
     * @param {vscode.Uri} skillFolder - Skill folder URI
     * @param {SkillDetailsType} skillDetails - Skill information
     * @returns {Array<PluginTreeItem<Resource>>} - updated tree items for IM dropdown
     * 
     * @memberOf SkillActionsViewProvider
     */
    private addIModelResources(
        treeItemsArray: Array<PluginTreeItem<Resource>>, skillFolder: vscode.Uri, 
        skillDetails: SkillDetailsType): Array<PluginTreeItem<Resource>> {
        Logger.verbose(`Calling method: ${SkillActionsViewProvider.name}.addIModelResources`);
        const skillId = skillDetails.skillId;

        treeItemsArray.push(
            new PluginTreeItem<Resource>(
                SKILL_ACTION_ITEMS.IM.ITEMS.EDITOR, null,
                vscode.TreeItemCollapsibleState.None,
                {
                    title: 'openUrl',
                    command: 'ask.container.openUrl',
                    arguments: [getIModelGeneratorLink(skillId, skillDetails.defaultLocale), {CommandType: 'IM_EDITOR'}],
                }, undefined,
                ContextValueTypes.SKILL,
            ),
        );

        treeItemsArray.push(
            new PluginTreeItem<Resource>(
                SKILL_ACTION_ITEMS.IM.ITEMS.DOWNLOAD, null,
                vscode.TreeItemCollapsibleState.None,
                {
                    title: 'syncInteractionModel',
                    command: 'ask.container.syncInteractionModel',
                    arguments: [skillFolder]
                }, undefined,
                ContextValueTypes.SKILL,
            ),
        );

        return treeItemsArray;
    }


    /**
     * Function to add testing related actions into Skill Actions treeview under 'Test skill' tree item
     * 
     * @private
     * @param {Array<PluginTreeItem<Resource>>} resourceArray - tree items
     * @returns {Array<PluginTreeItem<Resource>>} - updated tree items
     * 
     * @memberOf SkillActionsViewProvider
     */
    private addTestResources(
        treeItemsArray: Array<PluginTreeItem<Resource>>, skillFolder: vscode.Uri,  
        skillDetails: SkillDetailsType): Array<PluginTreeItem<Resource>> {
        const skillId: string = skillDetails.skillId;

        if (Utils.isNonBlankString(skillId)) {
             treeItemsArray.push(
                new PluginTreeItem<Resource>(
                    SKILL_ACTION_ITEMS.TEST.ITEMS.OPEN, null,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        title: 'simulateSkill',
                        command: 'askContainer.skillsConsole.simulateSkill'
                    }, undefined,
                    ContextValueTypes.SKILL,
                ),
            );

            treeItemsArray.push(
                new PluginTreeItem<Resource>(
                    SKILL_ACTION_ITEMS.TEST.ITEMS.REPLAY, null,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        title: 'simulateSkill',
                        command: 'askContainer.skillsConsole.simulateReplay'                  
                    }, undefined,
                    ContextValueTypes.SKILL,
                ),
            );

            treeItemsArray.push(
                new PluginTreeItem<Resource>(
                    SKILL_ACTION_ITEMS.TEST.ITEMS.VIEWPORT, null,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        title: 'simulateSkill',
                        command: 'askContainer.skillsConsole.changeSimulatorViewport'                  
                    }, undefined,
                    ContextValueTypes.SKILL,
                ),
            );
        }
        return treeItemsArray;
    }
}

