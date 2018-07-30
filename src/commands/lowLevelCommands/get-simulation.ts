'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const getSimulation = async () => {
    const requiredParameters: IRequiredInputParameter[] = [];
    requiredParameters.push(commandInputParameters.simulationId);
    requiredParameters.push(commandInputParameters.skillId);

    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.GET_SIMULATION.COMMAND,
        OPERATION.LOW_LEVEL.GET_SIMULATION.SUB_COMMAND,
        requiredParameters
    );
    CommandRunner.runCommand(command);
};
