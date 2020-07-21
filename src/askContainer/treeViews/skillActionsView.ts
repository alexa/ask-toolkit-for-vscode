import * as vscode from 'vscode';
import { PluginTreeItem, Resource } from '../../runtime';

import { SkillActionsViewProvider } from './treeViewProviders/skillActionsViewProvider';
import { TREE_VIEW_IDS } from '../../constants';

export class SkillActionsView {
    protected view: vscode.TreeView<PluginTreeItem<Resource>>;
    context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.view = vscode.window.createTreeView(
            TREE_VIEW_IDS.SKILL_ACTIONS, {
                treeDataProvider: new SkillActionsViewProvider(this), showCollapseAll: true 
            }
        );
        this.context = context;
    }

    changeTitle(label: string): void {
        if(this.view) {
            this.view.title = label;
        }
    }
}
