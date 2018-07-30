'use strict';
import * as vscode from 'vscode';
import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const validateSkill = async () => {
    const requiredParameters: IRequiredInputParameter[] = [];
    requiredParameters.push(commandInputParameters.skillId);
    // only used once
    requiredParameters.push(<IRequiredInputParameter> {
        parameterName: 'locales',
        queryInputMethod: 'showInputBox',
        options: <vscode.InputBoxOptions> {
            prompt: 'Please input a list of locales for executing skill validations. (separate by comma)'
        }
    });
    requiredParameters.push(commandInputParameters.stage);
    
    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.VALIDATE_SKILL.COMMAND,
        OPERATION.LOW_LEVEL.VALIDATE_SKILL.SUB_COMMAND,
        requiredParameters
    );
    CommandRunner.runCommand(command);
};
