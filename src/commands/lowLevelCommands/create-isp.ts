'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';


export const createIsp = async () => {
    const requiredParameters: IRequiredInputParameter[] = [];
    requiredParameters.push(commandInputParameters.file);

    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.CREATE_ISP.COMMAND,
        OPERATION.LOW_LEVEL.CREATE_ISP.SUB_COMMAND,
        requiredParameters
    );
    CommandRunner.runCommand(command);
};
