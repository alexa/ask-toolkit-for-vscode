import * as vscode from 'vscode';
import {
    PluginTreeItem, ContextValueTypes,
    CustomResource, Resource, Utils
} from '../../../runtime';
import { SkillsConsoleView } from '../skillConsoleView';
import { SKILLS_CONSOLE_ITEMS } from '../../../constants';
import { onSkillConsoleViewChangeEventEmitter } from '../../events';
import { Logger } from '../../../logger';

export class SkillsConsoleViewProvider implements vscode.TreeDataProvider<PluginTreeItem<Resource>> {
    readonly onDidChangeTreeData: vscode.Event<PluginTreeItem<Resource> | undefined> = onSkillConsoleViewChangeEventEmitter.event;
    readonly treeView: SkillsConsoleView;

    protected credsMgrViewItem: PluginTreeItem<Resource> | undefined;
    protected createSkillViewItem: PluginTreeItem<Resource> | undefined;
    protected updateSkillViewItem: PluginTreeItem<Resource> | undefined;
    protected localSkillViewItem: PluginTreeItem<Resource> | undefined;
    protected signInViewItem: PluginTreeItem<Resource> | undefined;

    constructor(treeView: SkillsConsoleView) {
        this.treeView = treeView;
    }

    refresh(): void {
        Logger.debug(`Calling method: ${SkillsConsoleViewProvider.name}.refresh`);
        onSkillConsoleViewChangeEventEmitter.fire(undefined);
    }

    getTreeItem(element: PluginTreeItem<Resource>): vscode.TreeItem | Thenable<vscode.TreeItem> {
        Logger.debug(`Calling method: ${SkillsConsoleViewProvider.name}.getTreeItem`);
        return element;
    }

    private addRootResources(resourceArray: Array<PluginTreeItem<Resource>>): Array<PluginTreeItem<Resource>> {
        Logger.verbose(`Calling method: ${SkillsConsoleViewProvider.name}.addRootResources`);
        if (!this.createSkillViewItem) {
            this.createSkillViewItem = new PluginTreeItem<CustomResource>(
                SKILLS_CONSOLE_ITEMS.CREATE_NEW_SKILL, null, vscode.TreeItemCollapsibleState.None,
                { title: 'New skill', command: 'ask.new' }, undefined, ContextValueTypes.SKILL,
            );
        }

        if (!this.updateSkillViewItem) {
            this.updateSkillViewItem = new PluginTreeItem<CustomResource>(
                SKILLS_CONSOLE_ITEMS.DOWNLOAD_SKILL, null, 
                vscode.TreeItemCollapsibleState.None,
                {
                    title: '_ViewAllSkills',
                    command: 'ask.container.viewAllSkills'
                }, undefined, ContextValueTypes.SKILL,
            );
        }

        if (!this.localSkillViewItem) {
            this.localSkillViewItem = new PluginTreeItem<CustomResource>(
                SKILLS_CONSOLE_ITEMS.OPEN_LOCAL_SKILL, null,
                vscode.TreeItemCollapsibleState.None,
                { title: 'Open workspace', command: 'ask.container.openWorkspace' }, undefined,
                ContextValueTypes.SKILL,
            );
        }

        resourceArray.push(
            this.createSkillViewItem, this.updateSkillViewItem, 
            this.localSkillViewItem);
        return resourceArray;
    }

    private addSignInResource(resourceArray: Array<PluginTreeItem<Resource>>): Array<PluginTreeItem<Resource>> {
        if (!this.signInViewItem) {
            this.signInViewItem = new PluginTreeItem<CustomResource>(
                SKILLS_CONSOLE_ITEMS.SIGN_IN, null, vscode.TreeItemCollapsibleState.None,
                { title: 'Sign in', command: 'ask.login' }, undefined, ContextValueTypes.SKILL,
            );
        }
        resourceArray.push(this.signInViewItem);
        return resourceArray;
    }
    
    async getChildren(element?: PluginTreeItem<Resource>): Promise<Array<PluginTreeItem<Resource>>> {
        Logger.debug(`Calling method: ${SkillsConsoleViewProvider.name}.getChildren`);
        const treeItems: Array<PluginTreeItem<Resource>> = [];
        try {
            const isProfileAuth = await Utils.isProfileAuth(this.treeView.extensionContext);
            if (isProfileAuth) {
                if (!element) {
                    this.addRootResources(treeItems);
                }
            } else {
                this.addSignInResource(treeItems);
            }
        } catch (err) {
            Logger.error(`Profile not authorized for skill management operations`, err);
            this.addSignInResource(treeItems);
        }
        return treeItems;
    }

    getParent(element?: PluginTreeItem<Resource>): PluginTreeItem<Resource> | undefined {
        Logger.debug(`Calling method: ${SkillsConsoleViewProvider.name}.getParent`);
        switch (element?.label) {
            case SKILLS_CONSOLE_ITEMS.SIGN_IN:
            case SKILLS_CONSOLE_ITEMS.PROFILE_MGR:
            case SKILLS_CONSOLE_ITEMS.CREATE_NEW_SKILL:
            case SKILLS_CONSOLE_ITEMS.DOWNLOAD_SKILL:
            case SKILLS_CONSOLE_ITEMS.OPEN_LOCAL_SKILL: {
                return undefined;
            }
            default:
                return undefined;
        }
    }
}
