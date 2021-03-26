/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import { AbstractCommand, CommandContext } from '../../runtime';
import { ProfileManagerWebview } from '../webViews/profileManagerWebview';
import { Logger } from '../../logger';

export class InitCommand extends AbstractCommand<void> {
    private profileManager: ProfileManagerWebview;

    constructor(profileManager: ProfileManagerWebview) {
        super('ask.init');
        this.profileManager = profileManager;
    }

    async execute(context: CommandContext): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}`);
        this.profileManager.showView();
        this.profileManager.populateProfilesList();
    }
}