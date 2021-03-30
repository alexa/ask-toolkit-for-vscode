/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import { AbstractCommand, CommandContext } from '../../runtime';
import { AplResourceSyncWebview } from '../webViews/aplResourceSyncWebview';
import * as vscode from 'vscode';
import { EXTENSION_COMMAND_CONFIG } from '../config/configuration';
import { Logger } from '../../logger';

export class SyncAplResourceCommand extends AbstractCommand<void> {

    constructor() {
        super(EXTENSION_COMMAND_CONFIG.DOWNLOAD_APL_DOCUMENT.NAME);
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async execute(context: CommandContext, skillFolderWs: vscode.Uri): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}`);
        const aplResourceSyncWebview = new AplResourceSyncWebview('Sync APL resource', 'syncAplResource',
            context.extensionContext, skillFolderWs);
        aplResourceSyncWebview.showView();
    }
}