'use strict';

import { LowLevelCommandBuilder } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { OPERATION } from '../../utils/configuration';


export const listVendors = async () => {    
    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.LIST_VENDORS.COMMAND,
        OPERATION.LOW_LEVEL.LIST_VENDORS.SUB_COMMAND,
        []
    );
    CommandRunner.runCommand(command);
};
