'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters, ispInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const getIsp = async () => {
    const requiredParameters: IRequiredInputParameter[] = [];
    requiredParameters.push(ispInputParameters.id);
    requiredParameters.push(commandInputParameters.stage);
    requiredParameters.push(ispInputParameters.summaryBoolean);


    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.GET_ISP.COMMAND,
        OPERATION.LOW_LEVEL.GET_ISP.SUB_COMMAND,
        requiredParameters
    );
    CommandRunner.runCommand(command);
};
