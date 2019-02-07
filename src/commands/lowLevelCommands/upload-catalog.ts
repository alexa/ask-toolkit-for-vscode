'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const uploadCatalog = async () => {
    const requiredParameters: IRequiredInputParameter[] = [];
    requiredParameters.push(commandInputParameters.catalogID);
    requiredParameters.push(commandInputParameters.file);

    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.UPLOAD_CATALOG.COMMAND,
        OPERATION.LOW_LEVEL.UPLOAD_CATALOG.SUB_COMMAND,
        requiredParameters
    );
    CommandRunner.runCommand(command);
};
