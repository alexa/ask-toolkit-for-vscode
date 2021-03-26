/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import {
    SmapiResource, AbstractCommand, CommandContext
} from '../../runtime';

import { SkillInfo } from '../../models/types';
import { executeClone } from '../../utils/cloneSkillHelper';
import { Logger } from '../../logger';

export class CloneSkillCommand extends AbstractCommand<void> {

    constructor() {
        super('askContainer.skillsConsole.cloneSkill');
    }

    async execute(context: CommandContext, skillInfo: SmapiResource<SkillInfo>): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}, args: `, skillInfo);
        await executeClone(context, skillInfo);
    }
}
