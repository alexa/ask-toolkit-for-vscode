/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import { CloneSkillCommand } from './cloneSkill/cloneSkill';

export class CloneSkillFromConsoleCommand extends CloneSkillCommand {
    constructor() {
        super('askContainer.skillsConsole.cloneSkillFromConsole');
    }
}
