'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const listPrivateDistributionAccounts = async () => {
    const requiredParameters: IRequiredInputParameter[] = [];
    requiredParameters.push(commandInputParameters.skillId);
    requiredParameters.push(commandInputParameters.privateDistributionAccountStage);

    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.LIST_PRIVATE_DISTRIBUTION_ACCOUNTS.COMMAND,
        OPERATION.LOW_LEVEL.LIST_PRIVATE_DISTRIBUTION_ACCOUNTS.SUB_COMMAND,
        requiredParameters
    );
    CommandRunner.runCommand(command);
};
