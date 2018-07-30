'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const invokeSkill = async () => {
    const requiredParameters: IRequiredInputParameter[] = [];
    requiredParameters.push(commandInputParameters.skillId);
    requiredParameters.push(commandInputParameters.file);
    requiredParameters.push(commandInputParameters.endpointRegion);

    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.INVOKE_SKILL.COMMAND,
        OPERATION.LOW_LEVEL.INVOKE_SKILL.SUB_COMMAND,
        requiredParameters
    );
    CommandRunner.runCommand(command);
};
