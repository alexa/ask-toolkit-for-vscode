/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { logAskError } from '../../exceptions';
import { Logger } from '../../logger';
import { AbstractCommand, CommandContext } from '../../runtime';
import { checkProfileSkillAccess } from '../../utils/skillHelper';
import { ManifestSyncWebview } from '../webViews/manifestSync';


export class SyncManifestCommand extends AbstractCommand<void> {

    private syncManifestView: ManifestSyncWebview;

    constructor(syncManifestView: ManifestSyncWebview) {
        super('ask.container.syncManifest');
        this.syncManifestView = syncManifestView;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async execute(context: CommandContext, skillFolderWs: vscode.Uri): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}`);
        try {
            checkProfileSkillAccess(context.extensionContext);
            this.syncManifestView.showView(skillFolderWs);
        } catch (err) {
            throw logAskError(`Cannot open sync manifest view`, err, true);
        }
    }
}