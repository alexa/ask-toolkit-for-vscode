'use strict';

import * as vscode from 'vscode';
import { LowLevelCommandBuilder, IRequiredInputParameter } from '../../utils/lowLevelCommandBuilder';
import { CommandRunner } from '../../utils/commandRunner';
import { commandInputParameters } from '../../utils/basicCommandInputParameters';
import { OPERATION } from '../../utils/configuration';

const INTERACTIVE_MODE = 'INTERACTIVE';
const FILE_MODE = 'FILE';

export const createAccountLinking = async () => {
    const requiredParameters: IRequiredInputParameter[] = [];
    requiredParameters.push(commandInputParameters.skillId);
    requiredParameters.push(commandInputParameters.stage);

    const uploadSchemaMethod = await vscode.window.showQuickPick([INTERACTIVE_MODE, FILE_MODE], {
        'placeHolder': 'Do you want to use interactive mode or use the file format to upload the account linking schemas?'
    });

    if (uploadSchemaMethod === FILE_MODE) {
        requiredParameters.push(commandInputParameters.file);
    }

    const command = await LowLevelCommandBuilder.buildCommand(
        OPERATION.LOW_LEVEL.CREATE_ACCOUNT_LINKING.COMMAND,
        OPERATION.LOW_LEVEL.CREATE_ACCOUNT_LINKING.SUB_COMMAND,
        requiredParameters
    );
    CommandRunner.runCommand(command);
};
