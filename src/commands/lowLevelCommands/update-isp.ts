'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters, ispInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const updateIsp = async () => {
    const requiredParameters: IRequiredInputParameter[] = [];
    requiredParameters.push(ispInputParameters.id);
    requiredParameters.push(commandInputParameters.file);
    requiredParameters.push(commandInputParameters.eTag);
    
    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.UPDATE_ISP.COMMAND,
        OPERATION.LOW_LEVEL.UPDATE_ISP.SUB_COMMAND,
        requiredParameters
    );
    CommandRunner.runCommand(command);
};
