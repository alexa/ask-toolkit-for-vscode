import * as vscode from 'vscode';
import { PluginTreeItem, Resource, AbstractTreeView } from '../../runtime';

import { HelpViewProvider } from './treeViewProviders/helpViewProvider';
import { TREE_VIEW_IDS } from '../../constants';

export class HelpView extends AbstractTreeView {
    protected view: vscode.TreeView<PluginTreeItem<Resource>>;

    constructor(context: vscode.ExtensionContext) {
        super(context);
        this.view = vscode.window.createTreeView(TREE_VIEW_IDS.HELP, {
            treeDataProvider: new HelpViewProvider(this),
            showCollapseAll: true,
        });
    }
}
