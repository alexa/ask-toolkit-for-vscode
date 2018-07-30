'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { lambdaParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const lambdaLog = async () => {
    const requiredParameters: IRequiredInputParameter[] = [];
    requiredParameters.push(lambdaParameters.function);
    requiredParameters.push(lambdaParameters.startTime);
    requiredParameters.push(lambdaParameters.endTime);
    requiredParameters.push(lambdaParameters.numberOfLogs);

    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.LAMBDA_LOG.COMMAND,
        OPERATION.LOW_LEVEL.LAMBDA_LOG.SUB_COMMAND,
        requiredParameters
    );
    CommandRunner.runCommand(command);
};
