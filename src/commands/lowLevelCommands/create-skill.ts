'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const createSkill = async () => {
    const requiredParameters: IRequiredInputParameter[] = [];
    requiredParameters.push(commandInputParameters.file);

    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.CREATE_SKILL.COMMAND,
        OPERATION.LOW_LEVEL.CREATE_SKILL.SUB_COMMAND,
        requiredParameters
    );
    CommandRunner.runCommand(command);
};
