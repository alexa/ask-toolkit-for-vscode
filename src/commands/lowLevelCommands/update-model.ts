'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const updateModel = async () => {
    const inputParameters: IRequiredInputParameter[] = [];
    inputParameters.push(commandInputParameters.skillId);
    inputParameters.push(commandInputParameters.locale);
    inputParameters.push(commandInputParameters.file);
    inputParameters.push(commandInputParameters.eTag);
    
    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.UPDATE_MODEL.COMMAND,
        OPERATION.LOW_LEVEL.UPDATE_MODEL.SUB_COMMAND,
        inputParameters
    );
    CommandRunner.runCommand(command);
};
