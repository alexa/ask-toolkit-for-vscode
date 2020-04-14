'use strict';
import * as vscode from "vscode";
import { CommandRunner, ICommand } from "../../utils/commandRunner";
import { EXTENSION_CONFIG, OPERATION } from "../../utils/configuration";
import { wasAskCliInstalled } from "../../utils/askCliHelper";
import { ProfileManager } from "../../utils/profileManager";

const COMMAND_NAME = EXTENSION_CONFIG.DEFAULT_PREFIX + '.' + OPERATION.HIGH_LEVEL.INITIALIZATION.EXTENSION_REGISTERED_NAME;

/**
 * Implements the `ask init` command.  Currently available options:
 * 
 * @see {@link https://developer.amazon.com/en-US/docs/alexa/smapi/ask-cli-command-reference.html#init-command}
 */
export const init = vscode.commands.registerCommand(COMMAND_NAME, async () => {
    if (!await wasAskCliInstalled()) {
        return;
    }
    const initCommand =  <ICommand> {
        command: OPERATION.HIGH_LEVEL.INITIALIZATION.COMMAND,
        commandParameters: new Map<string, any>()
    };
    CommandRunner.runCommand(initCommand);

    // no matter `ask init` successful or not, the cached profile will be empty
    // refresh cache method will get triggered next time when the extension search for profiles.
    ProfileManager.clearCachedProfile();
});