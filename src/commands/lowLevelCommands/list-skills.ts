'use strict';

import { LowLevelCommandBuilder } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { OPERATION } from '../../utils/configuration';


export const listSkills = async () => {    
    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.LIST_SKILLS.COMMAND,
        OPERATION.LOW_LEVEL.LIST_SKILLS.SUB_COMMAND,
        []
    );
    CommandRunner.runCommand(command);
};