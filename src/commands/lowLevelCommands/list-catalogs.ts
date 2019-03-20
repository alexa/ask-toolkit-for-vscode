'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { OPERATION } from '../../utils/configuration';

export const listCatalogs = async () => {
    const requiredParameters: IRequiredInputParameter[] = [];

    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.LIST_CATALOGS.COMMAND,
        OPERATION.LOW_LEVEL.LIST_CATALOGS.SUB_COMMAND,
        requiredParameters
    );
    CommandRunner.runCommand(command);
};
