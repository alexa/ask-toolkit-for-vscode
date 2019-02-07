'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const requestFeedbackFromBetaTesters = async () => {
    const requiredParameters: IRequiredInputParameter[] = [];
    requiredParameters.push(commandInputParameters.skillId);
    requiredParameters.push(commandInputParameters.file);

    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.REQUEST_FEEDBACK_FROM_BETA_TESTERS.COMMAND,
        OPERATION.LOW_LEVEL.REQUEST_FEEDBACK_FROM_BETA_TESTERS.SUB_COMMAND,
        requiredParameters
    );
    CommandRunner.runCommand(command);
};
