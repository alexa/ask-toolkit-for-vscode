'use strict';
import * as vscode from 'vscode';

import { EXTERNAL_LINKS } from '../../constants';
import { AbstractCommand, CommandContext } from '../../runtime';
import { Logger } from '../../logger';

export class ContactToolkitTeamCommand extends AbstractCommand<void> {
    protected feedbackOptions = new Map<string, string>();

    constructor() {
        super('ask.contactToolkitTeam');

        for (const option of Object.values(EXTERNAL_LINKS.CONTACT_ALEXA_TEAM)) {
            this.feedbackOptions.set(option.TITLE, option.URL);
        }
    }

    async execute(context: CommandContext): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}`);
        
        const pickedContactMethod = await vscode.window.showQuickPick(
            Array.from(this.feedbackOptions.keys()));
        if (pickedContactMethod) {
            await vscode.env.openExternal(vscode.Uri.parse(
                this.feedbackOptions.get(pickedContactMethod) as string));
        }
    }
}
