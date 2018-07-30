'use strict';
import * as vscode from "vscode";
import { CommandRunner } from "../../utils/commandRunner";
import { EXTENSION_CONFIG, OPERATION, ERROR_AND_WARNING } from "../../utils/configuration";
import { initializeHighLevelCommandWithProfile, doesWorkSpaceExist, askUserToPickAWorkspace } from "../../utils/highLevelCommandHelper";
import { processAbortedError } from "../../utils/pluginError";
import { wasAskCliInstalled } from "../../utils/askCliHelper";

const COMMAND_NAME = EXTENSION_CONFIG.DEFAULT_PREFIX + '.' + OPERATION.HIGH_LEVEL.DIFF.EXTENSION_REGISTERED_NAME;

export const diff = vscode.commands.registerCommand(COMMAND_NAME, async () => {
    if (!await wasAskCliInstalled()) {
        return;
    }

    if (!doesWorkSpaceExist()) {
        await askUserToPickAWorkspace(ERROR_AND_WARNING.CHECK_WORKSPACE_EXISTS.DEPLOY_AND_RELATED_ERROR_MESSAGE);
        return;
    }

    const diffCommand = await initializeHighLevelCommandWithProfile(OPERATION.HIGH_LEVEL.DIFF.COMMAND);
    if (!diffCommand) {
        return;
    }

    const diffResource = await vscode.window.showQuickPick(EXTENSION_CONFIG.VALID_RESOURCES, {placeHolder: 'all'});
    if (!diffResource) {
        throw processAbortedError('Missing diff target');
    }
    diffCommand.commandParameters!.set('target', diffResource);
    CommandRunner.runCommand(diffCommand);
});