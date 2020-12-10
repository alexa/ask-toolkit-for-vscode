// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-undef */
import * as vscode from 'vscode';
import {
    PluginTreeItem, Resource, CustomResource, ContextValueTypes
} from '../../../runtime';

import { HelpView } from '../helpView';
import { HELP_VIEW_ITEMS, EXTERNAL_LINKS } from '../../../constants';
import { Logger } from '../../../logger';

export class HelpViewProvider implements vscode.TreeDataProvider<PluginTreeItem<Resource>> {
    private _onDidChangeTreeData = new vscode.EventEmitter<PluginTreeItem<Resource> | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
    readonly treeView: HelpView;

    constructor(view: HelpView) {
        this.treeView = view;
    }

    refresh(): void {
        Logger.debug(`Calling method: ${HelpViewProvider.name}.refresh`);
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: PluginTreeItem<Resource>): vscode.TreeItem | Thenable<vscode.TreeItem> {
        Logger.debug(`Calling method: ${HelpViewProvider.name}.getTreeItem`);
        return element;
    }

    getChildren(element?: PluginTreeItem<Resource>): Array<PluginTreeItem<Resource>> {
        Logger.debug(`Calling method: ${HelpViewProvider.name}.getChildren`);
        const treeItems: Array<PluginTreeItem<Resource>> = [];
        if (!element) {
            this.addRootResources(treeItems);
        } else if (element.label === HELP_VIEW_ITEMS.GETTING_STARTED) {
            this.addGettingStartedResources(treeItems);
        } else if (element.label === HELP_VIEW_ITEMS.GETTING_STARTED_SDK) {
            this.addSdkResources(treeItems);
        }
        return treeItems;
    }

    private addRootResources(resourceArray: Array<PluginTreeItem<Resource>>): Array<PluginTreeItem<Resource>> {
        Logger.verbose(`Calling method: ${HelpViewProvider.name}.addRootResources`);
        resourceArray.push(new PluginTreeItem<CustomResource>(
            HELP_VIEW_ITEMS.GETTING_STARTED, null, vscode.TreeItemCollapsibleState.Collapsed,
            undefined, undefined, ContextValueTypes.SKILL,
        ));
        // TODO: move title & command string to constant
        resourceArray.push(new PluginTreeItem<CustomResource>(
            HELP_VIEW_ITEMS.WHATS_NEW, null, vscode.TreeItemCollapsibleState.None,
            {
                title: 'welcome',
                command: 'ask.welcome',
            }, undefined, ContextValueTypes.SKILL,
        ));
    
        return resourceArray;
    }
    
    // eslint-disable-next-line max-len
    private addGettingStartedResources(resourceArray: Array<PluginTreeItem<Resource>>): Array<PluginTreeItem<Resource>> {
        Logger.verbose(`Calling method: ${HelpViewProvider.name}.addGettingStartedResources`);
        resourceArray.push(new PluginTreeItem<CustomResource>(
            HELP_VIEW_ITEMS.GETTING_STARTED_SDK, null,
            vscode.TreeItemCollapsibleState.Collapsed,
            undefined, undefined,
            ContextValueTypes.SKILL,
        ));
    
        resourceArray.push(new PluginTreeItem<CustomResource>(
            HELP_VIEW_ITEMS.GETTING_STARTED_CLI, null,
            vscode.TreeItemCollapsibleState.None, {
                title: 'openUrl',
                command: 'ask.container.openUrl',
                arguments: [EXTERNAL_LINKS.TOOLS_DOCS.CLI, true, {CommandType: 'TOOLS_DOCS_CLI'}],
            }, undefined,
            ContextValueTypes.SKILL,
        ));
    
        resourceArray.push(new PluginTreeItem<CustomResource>(
            HELP_VIEW_ITEMS.GETTING_STARTED_VSCODE, null,
            vscode.TreeItemCollapsibleState.None, {
                title: 'openUrl',
                command: 'ask.container.openUrl',
                arguments: [EXTERNAL_LINKS.TOOLS_DOCS.VSCODE, true, {CommandType: 'TOOLS_DOCS_VSCODE'}],
            }, undefined,
            ContextValueTypes.SKILL,
        ));
    
        return resourceArray;
    }
    
    // eslint-disable-next-line max-len
    private addSdkResources(resourceArray: Array<PluginTreeItem<Resource>>): Array<PluginTreeItem<Resource>> {
        Logger.verbose(`Calling method: ${HelpViewProvider.name}.addSdkResources`);
        
        resourceArray.push(new PluginTreeItem<CustomResource>(
            HELP_VIEW_ITEMS.GETTING_STARTED_ASK_SDK, null,
            vscode.TreeItemCollapsibleState.None,
            {
                title: 'openUrl',
                command: 'ask.container.openUrl',
                arguments: [EXTERNAL_LINKS.TOOLS_DOCS.ASK_SDK, true, {CommandType: 'TOOLS_DOCS_ASK_SDK'}],
            }, undefined,
            ContextValueTypes.SKILL,
        ));
    
        resourceArray.push(new PluginTreeItem<CustomResource>(
            HELP_VIEW_ITEMS.GETTING_STARTED_SMAPI_SDK, null,
            vscode.TreeItemCollapsibleState.None, {
                title: 'openUrl',
                command: 'ask.container.openUrl',
                arguments: [EXTERNAL_LINKS.TOOLS_DOCS.SMAPI_SDK, true, {CommandType: 'TOOLS_DOCS_SMAPI_SDK'}],
            }, undefined,
            ContextValueTypes.SKILL,
        ));
    
        return resourceArray;
    }
}
