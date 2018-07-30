'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { ispInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const resetIspEntitlement = async () => {
    const requiredParameters: IRequiredInputParameter[] = [];
    requiredParameters.push(ispInputParameters.id);

    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.RESET_ISP_ENTITLEMENT.COMMAND,
        OPERATION.LOW_LEVEL.RESET_ISP_ENTITLEMENT.SUB_COMMAND,
        requiredParameters
    );
    CommandRunner.runCommand(command);
};
