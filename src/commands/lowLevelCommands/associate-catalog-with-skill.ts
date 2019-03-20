'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const associateCatalogWithSkill = async () => {
    const requiredParameters: IRequiredInputParameter[] = [];
    requiredParameters.push(commandInputParameters.skillId);
    requiredParameters.push(commandInputParameters.catalogID);

    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.ASSOCIATE_CATALOG_WITH_SKILL.COMMAND,
        OPERATION.LOW_LEVEL.ASSOCIATE_CATALOG_WITH_SKILL.SUB_COMMAND,
        requiredParameters
    );
    CommandRunner.runCommand(command);
};
