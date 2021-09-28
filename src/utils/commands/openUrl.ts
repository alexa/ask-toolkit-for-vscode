/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { logAskError } from '../../exceptions';
import { Logger } from '../../logger';
import { AbstractCommand, CommandContext } from '../../runtime';
import { checkProfileSkillAccess } from '../skillHelper';



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
            throw logAskError(`Open URL failed`, err, true);
        }
    }
}
