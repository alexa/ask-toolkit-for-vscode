'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const deleteAccountLinking = async () => {
    const requiredParameters: IRequiredInputParameter[] = [];
    requiredParameters.push(commandInputParameters.skillId);

    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.DELETE_ACCOUNT_LINKING.COMMAND,
        OPERATION.LOW_LEVEL.DELETE_ACCOUNT_LINKING.SUB_COMMAND,
        requiredParameters
    );
    CommandRunner.runCommand(command);
};
