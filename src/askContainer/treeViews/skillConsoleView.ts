import * as vscode from 'vscode';
import { PluginTreeItem, Resource } from '../../runtime';

import { SkillsConsoleViewProvider } from './treeViewProviders/skillConsoleViewProvider';
import { TREE_VIEW_IDS } from '../../constants';

export class SkillsConsoleView {
    view: vscode.TreeView<PluginTreeItem<Resource> | undefined>;
    extensionContext: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.extensionContext = context;
        this.view = vscode.window.createTreeView(
            TREE_VIEW_IDS.SKILLS_CONSOLE, {
                treeDataProvider: new SkillsConsoleViewProvider(this), 
                showCollapseAll: true 
            }
        );
    }

    changeTitle(label: string): void {
        if(this.view) {
            this.view.title = label;
        }
    }
}
