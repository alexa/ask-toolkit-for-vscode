'use strict';
import * as vscode from "vscode";
import { CommandRunner, ICommand } from "../../utils/commandRunner";
import { EXTENSION_CONFIG, OPERATION } from "../../utils/configuration";
import { wasAskCliInstalled } from "../../utils/askCliHelper";
import { ProfileManager } from "../../utils/profileManager";

const COMMAND_NAME = EXTENSION_CONFIG.DEFAULT_PREFIX + '.' + OPERATION.HIGH_LEVEL.CONFIGURE.EXTENSION_REGISTERED_NAME;

/**
 * Implements the `ask configure` command.  This has taken over for the `ask init` command with regards to 
 * authentication and profile configuration. 
 * 
 * Which may not be possible, as v2 of the `ask cli` doesn't actually have the `--list-profiles` 
 * argument.
 * 
 * @since v2.0
 * @see {@link https://developer.amazon.com/en-US/docs/alexa/smapi/ask-cli-command-reference.html#configure-command}
 */
export const configure = vscode.commands.registerCommand(COMMAND_NAME, async () => {
    if (!await wasAskCliInstalled()) {
        return;
    }
    const configureCommand =  <ICommand> {
        command: OPERATION.HIGH_LEVEL.CONFIGURE.COMMAND,
        commandParameters: new Map<string, any>()
    };
    CommandRunner.runCommand(configureCommand);

    // no matter `ask configure` successful or not, the cached profile will be empty
    // refresh cache method will get triggered next time when the extension search for profiles.
    ProfileManager.clearCachedProfile();
});