'use strict';

import * as vscode from 'vscode';
import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

export const intentRequestsHistory = async () => {
    const inputParameters: IRequiredInputParameter[] = [];
    const filters = <IRequiredInputParameter> {
        parameterName: 'filters',
        queryInputMethod: 'showInputBox',
        options: <vscode.InputBoxOptions> {
            prompt: 'string of semicolon-delimited filters in the format "Name=[field],Values=[value1][,value2...]". [Hit "Enter" to continue and omit this parameter]',
        },
        isRequired: false
    };

    inputParameters.push(commandInputParameters.skillId);
    inputParameters.push(filters);
    inputParameters.push(commandInputParameters.intentRequestsHistorySortDirection);
    inputParameters.push(commandInputParameters.intentRequestsHistorySortField);
    inputParameters.push(commandInputParameters.intentRequestsHistoryMaxResults);
    inputParameters.push(commandInputParameters.nextToken);

    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.INTENT_REQUESTS_HISTORY.COMMAND,
        OPERATION.LOW_LEVEL.INTENT_REQUESTS_HISTORY.SUB_COMMAND,
        inputParameters
    );
    CommandRunner.runCommand(command);
};
