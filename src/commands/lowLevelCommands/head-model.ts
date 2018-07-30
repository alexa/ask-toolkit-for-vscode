'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const headModel = async () => {
    const requiredParameters: IRequiredInputParameter[] = [];
    requiredParameters.push(commandInputParameters.skillId);
    requiredParameters.push(commandInputParameters.locale);
    requiredParameters.push(commandInputParameters.stage);

    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.HEAD_MODEL.COMMAND,
        OPERATION.LOW_LEVEL.HEAD_MODEL.SUB_COMMAND,
        requiredParameters
    );
    CommandRunner.runCommand(command);
};
