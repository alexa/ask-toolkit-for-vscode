'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const createCatalog = async () => {
    const requiredParameters: IRequiredInputParameter[] = [];
    requiredParameters.push(commandInputParameters.catalogType);
    requiredParameters.push(commandInputParameters.catalogTitle);
    requiredParameters.push(commandInputParameters.catalogUsage);

    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.CREATE_CATALOG.COMMAND,
        OPERATION.LOW_LEVEL.CREATE_CATALOG.SUB_COMMAND,
        requiredParameters
    );
    CommandRunner.runCommand(command);
};
