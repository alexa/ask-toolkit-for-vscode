'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const getSkillStatus = async () => {
    const requiredParameters: IRequiredInputParameter[] = [];
    requiredParameters.push(commandInputParameters.skillId);

    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.GET_SKILL_STATUS.COMMAND,
        OPERATION.LOW_LEVEL.GET_SKILL_STATUS.SUB_COMMAND,
        requiredParameters
    );
    CommandRunner.runCommand(command);
};
