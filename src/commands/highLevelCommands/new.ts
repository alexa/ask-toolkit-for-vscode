'use strict';
import * as vscode from "vscode";
import { CommandRunner } from "../../utils/commandRunner";
import { EXTENSION_CONFIG, OPERATION, ERROR_AND_WARNING } from "../../utils/configuration";
import { initializeHighLevelCommandWithProfile, openAsWorkspaceWhenDirectoryCreated, formatSkillName, doesWorkSpaceExist, askUserToPickAWorkspace } from "../../utils/highLevelCommandHelper";
import { processAbortedError } from "../../utils/pluginError";
import { wasAskCliInstalled } from "../../utils/askCliHelper";

const COMMAND_NAME = EXTENSION_CONFIG.DEFAULT_PREFIX + '.' + OPERATION.HIGH_LEVEL.NEW.EXTENSION_REGISTERED_NAME;

export const newBasicSkill = vscode.commands.registerCommand(COMMAND_NAME, async () => {
    if (!await wasAskCliInstalled()) {
        return;
    }
    if (!doesWorkSpaceExist()) {
        await askUserToPickAWorkspace(ERROR_AND_WARNING.CHECK_WORKSPACE_EXISTS.CREATE_CLONE_ERROR_MESSAGE);
        return;
    }

    const newBasicSkillCommand = await initializeHighLevelCommandWithProfile(OPERATION.HIGH_LEVEL.NEW.COMMAND);
    if (!newBasicSkillCommand) {
        return;
    }
    const inputName = await vscode.window.showInputBox(<vscode.InputBoxOptions> {
        prompt: 'Please input the skill name',
        validateInput: (input: string): string | undefined => {
            if (input.trim().length === 0) {
                return 'Please input a non-empty string as the skill name.';
            } else {
                return ;
            }
        }
    });
    if (!inputName) {
        throw processAbortedError('Missing skill name');
    }
    const skillName = formatSkillName(inputName);
    newBasicSkillCommand.commandParameters!.set('skill-name', skillName);
    await openAsWorkspaceWhenDirectoryCreated(skillName);
    CommandRunner.runCommand(newBasicSkillCommand);

});
