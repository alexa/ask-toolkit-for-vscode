'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const simulateSkill = async () => {
    const parameters: IRequiredInputParameter[] = [];
    parameters.push(commandInputParameters.skillId);
    parameters.push(commandInputParameters.simulationInputUtterance);
    parameters.push(commandInputParameters.locale);

    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.SIMULATE_SKILL.COMMAND,
        OPERATION.LOW_LEVEL.SIMULATE_SKILL.SUB_COMMAND,
        parameters
    );
    CommandRunner.runCommand(command);
};
