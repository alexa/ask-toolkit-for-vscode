'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const updateBetaTest = async () => {
    const requiredParameters: IRequiredInputParameter[] = [];
    requiredParameters.push(commandInputParameters.skillId);
    requiredParameters.push(commandInputParameters.feedbackEmail);

    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.UPDATE_BETA_TEST.COMMAND,
        OPERATION.LOW_LEVEL.UPDATE_BETA_TEST.SUB_COMMAND,
        requiredParameters
    );
    CommandRunner.runCommand(command);
};
