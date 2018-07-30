'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const getValidation = async () => {
    const requiredParameters: IRequiredInputParameter[] = [];
    requiredParameters.push(commandInputParameters.validationId);
    requiredParameters.push(commandInputParameters.skillId);
    requiredParameters.push(commandInputParameters.stage);

    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.GET_VALIDATION.COMMAND,
        OPERATION.LOW_LEVEL.GET_VALIDATION.SUB_COMMAND,
        requiredParameters
    );
    CommandRunner.runCommand(command);
};
