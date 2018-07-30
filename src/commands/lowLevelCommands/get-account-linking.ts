'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const getAccountLinking = async () => {
    const requiredParameters: IRequiredInputParameter[] = [];
    requiredParameters.push(commandInputParameters.skillId);
    requiredParameters.push(commandInputParameters.stage);

    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.GET_ACCOUNT_LINKING.COMMAND,
        OPERATION.LOW_LEVEL.GET_ACCOUNT_LINKING.SUB_COMMAND,
        requiredParameters
    );
    CommandRunner.runCommand(command);
};
