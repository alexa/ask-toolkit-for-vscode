'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const listCatalogUploads = async () => {
    const requiredParameters: IRequiredInputParameter[] = [];
    requiredParameters.push(commandInputParameters.catalogID);

    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.LIST_CATALOG_UPLOADS.COMMAND,
        OPERATION.LOW_LEVEL.LIST_CATALOG_UPLOADS.SUB_COMMAND,
        requiredParameters
    );
    CommandRunner.runCommand(command);
};
