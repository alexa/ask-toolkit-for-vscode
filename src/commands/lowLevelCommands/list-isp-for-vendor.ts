'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters, ispInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const listIspForVendor = async () => {
    const parameters: IRequiredInputParameter[] = [];
    parameters.push(commandInputParameters.vendorId);
    parameters.push(ispInputParameters.stage);
    parameters.push(ispInputParameters.isAssociatedWithSkill);
    parameters.push(ispInputParameters.type);
    parameters.push(ispInputParameters.status);
    parameters.push(ispInputParameters.referenceName);
    parameters.push(commandInputParameters.maxItem);

    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.LIST_ISP_FOR_VENDOR.COMMAND,
        OPERATION.LOW_LEVEL.LIST_ISP_FOR_VENDOR.SUB_COMMAND,
        parameters
    );
    CommandRunner.runCommand(command);
};
