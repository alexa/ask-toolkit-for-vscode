'use strict';
import * as vscode from "vscode";
import { CommandRunner } from "../../utils/commandRunner";
import { EXTENSION_CONFIG, OPERATION, ERROR_AND_WARNING } from "../../utils/configuration";
import { initializeHighLevelCommandWithProfile, openAsWorkspaceWhenDirectoryCreated, doesWorkSpaceExist, askUserToPickAWorkspace } from "../../utils/highLevelCommandHelper";
import { wasAskCliInstalled } from "../../utils/askCliHelper";

const COMMAND_NAME = EXTENSION_CONFIG.DEFAULT_PREFIX + '.' + OPERATION.HIGH_LEVEL.CLONE.EXTENSION_REGISTERED_NAME;

export const clone = vscode.commands.registerCommand(COMMAND_NAME, async () => {
    if (!await wasAskCliInstalled()) {
        return;
    }

    if (!doesWorkSpaceExist()) {
        await askUserToPickAWorkspace(ERROR_AND_WARNING.CHECK_WORKSPACE_EXISTS.CREATE_CLONE_ERROR_MESSAGE);
        return;
    }
    
    const cloneCommand = await initializeHighLevelCommandWithProfile(OPERATION.HIGH_LEVEL.CLONE.COMMAND);
    if (!cloneCommand) {
        return;
    }
    await openAsWorkspaceWhenDirectoryCreated();
    CommandRunner.runCommand(cloneCommand); 
});