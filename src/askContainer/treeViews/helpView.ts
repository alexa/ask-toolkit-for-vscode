import * as vscode from 'vscode';
import { PluginTreeItem, Resource } from '../../runtime';

import { HelpViewProvider } from './treeViewProviders/helpViewProvider';
import { TREE_VIEW_IDS } from '../../constants';

export class HelpView {
    protected view: vscode.TreeView<PluginTreeItem<Resource>>;

    constructor(context: vscode.ExtensionContext) {
        this.view = vscode.window.createTreeView(
            TREE_VIEW_IDS.HELP, {
                treeDataProvider: new HelpViewProvider(this), showCollapseAll: true 
            }
        );
    }

    changeTitle(label: string): void {
        if(this.view) {
            this.view.title = label;
        }
    }
}
