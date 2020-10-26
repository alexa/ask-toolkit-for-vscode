import * as vscode from 'vscode';

import { AbstractCommand, CommandContext } from '../../runtime';
import { openWorkspaceFolder } from '../../utils/workspaceHelper';
import { loggableAskError } from '../../exceptions';
import { Logger } from '../../logger';

export class OpenWorkspaceCommand extends AbstractCommand<void> {
    constructor() {
        super('ask.container.openWorkspace');
    }

    async execute(context: CommandContext): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}`);
        const userChoseWorkSpace = await vscode.window.showOpenDialog({
            "canSelectFiles": false,
            "canSelectFolders": true,
            "canSelectMany": false
        });
        if (!userChoseWorkSpace) {
            throw loggableAskError('Cannot find a workspace to create the skill project');
        }

        await openWorkspaceFolder(userChoseWorkSpace[0]);
        // await vscode.commands.executeCommand('vscode.openFolder', userChoseWorkSpace[0]);
        
    }
}
