'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const enableSkill = async () => {
    const requiredParameters: IRequiredInputParameter[] = [];
    requiredParameters.push(commandInputParameters.skillId);

    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.ENABLE_SKILL.COMMAND,
        OPERATION.LOW_LEVEL.ENABLE_SKILL.SUB_COMMAND,
        requiredParameters
    );
    CommandRunner.runCommand(command);
};