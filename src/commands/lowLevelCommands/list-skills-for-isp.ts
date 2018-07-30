'use strict';

import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters, ispInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const listSkillsForIsp = async () => {
    const requiredParameters: IRequiredInputParameter[] = [];
    requiredParameters.push(ispInputParameters.id);
    requiredParameters.push(commandInputParameters.stage);

    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.LIST_SKILLS_FOR_ISP.COMMAND,
        OPERATION.LOW_LEVEL.LIST_SKILLS_FOR_ISP.SUB_COMMAND,
        requiredParameters
    );
    CommandRunner.runCommand(command);
};
