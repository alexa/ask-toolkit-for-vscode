'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const addPrivateDistributionAccount = async () => {
    const requiredParameters: IRequiredInputParameter[] = [];
    requiredParameters.push(commandInputParameters.skillId);
    requiredParameters.push(commandInputParameters.privateDistributionAccountStage);
    requiredParameters.push(commandInputParameters.accountId);

    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.ADD_PRIVATE_DISTRIBUTION_ACCOUNT.COMMAND,
        OPERATION.LOW_LEVEL.ADD_PRIVATE_DISTRIBUTION_ACCOUNT.SUB_COMMAND,
        requiredParameters
    );
    CommandRunner.runCommand(command);
};
