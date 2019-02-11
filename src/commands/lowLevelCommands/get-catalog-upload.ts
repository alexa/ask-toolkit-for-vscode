'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const getCatalogUpload = async () => {
    const requiredParameters: IRequiredInputParameter[] = [];
    requiredParameters.push(commandInputParameters.catalogID);
    requiredParameters.push(commandInputParameters.catalogUploadID);

    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.GET_CATALOG_UPLOAD.COMMAND,
        OPERATION.LOW_LEVEL.GET_CATALOG_UPLOAD.SUB_COMMAND,
        requiredParameters
    );
    CommandRunner.runCommand(command);
};
