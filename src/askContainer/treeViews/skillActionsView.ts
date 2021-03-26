/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { PluginTreeItem, Resource, AbstractTreeView } from '../../runtime';

import { SkillActionsViewProvider } from './treeViewProviders/skillActionsViewProvider';
import { TREE_VIEW_IDS } from '../../constants';

export class SkillActionsView extends AbstractTreeView {
    protected view: vscode.TreeView<PluginTreeItem<Resource>>;

    constructor(context: vscode.ExtensionContext) {
        super(context);
        this.view = vscode.window.createTreeView(TREE_VIEW_IDS.SKILL_ACTIONS, {
            treeDataProvider: new SkillActionsViewProvider(this),
            showCollapseAll: true,
        });
    }
}
