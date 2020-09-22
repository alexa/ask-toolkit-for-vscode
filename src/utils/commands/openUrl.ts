import * as vscode from 'vscode';

import { AbstractCommand, CommandContext } from '../../runtime';

import { checkProfileSkillAccess } from '../skillHelper';
import { loggableAskError } from '../../exceptions';
import { Logger } from '../../logger';

export class OpenUrlCommand extends AbstractCommand<void> {
    constructor() {
        super('ask.container.openUrl');
    }

    async execute(context: CommandContext, url: string, skipSkillAccessCheck=false): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}, args: `, url, skipSkillAccessCheck);
        
        try {
            if (!skipSkillAccessCheck) {
                checkProfileSkillAccess(context.extensionContext);
            }
            await vscode.env.openExternal(vscode.Uri.parse(url));
        } catch (err) {
            throw loggableAskError(`Open URL failed`, err, true);
        }
    }
}
