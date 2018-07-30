'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const submit = async () => {
    const requiredParameters: IRequiredInputParameter[] = [];
    requiredParameters.push(commandInputParameters.skillId);
    
    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.SUBMIT.COMMAND,
        OPERATION.LOW_LEVEL.SUBMIT.SUB_COMMAND,
        requiredParameters
    );
    CommandRunner.runCommand(command);
};
