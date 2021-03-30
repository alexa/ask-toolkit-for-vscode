/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import { SimulateSkillWebview } from '../webViews/simulateSkillWebview';
import { Logger } from '../../logger';
import { loggableAskError } from '../../exceptions';
import { AbstractCommand, CommandContext } from '../../runtime';

export class SimulateReplayCommand extends AbstractCommand<void> {
    private simulateSkillWebview: SimulateSkillWebview;

    constructor(webview: SimulateSkillWebview) {
        super('askContainer.skillsConsole.simulateReplay');
        this.simulateSkillWebview = webview;
    }

    async execute(context: CommandContext): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}`);
        try {
            this.simulateSkillWebview.showView();
            void this.simulateSkillWebview.replaySessionInSimulator();

        } catch (err) {
            throw loggableAskError(`Cannot open test skill view`, err, true);
        }
    }
}