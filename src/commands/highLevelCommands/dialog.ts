'use strict';
import * as vscode from "vscode";
import { CommandRunner, ICommand } from "../../utils/commandRunner";
import { EXTENSION_CONFIG, OPERATION, ERROR_AND_WARNING } from "../../utils/configuration";
import { initializeHighLevelCommandWithProfile, getLocalsFromCurrentWorkspace, doesWorkSpaceExist, askUserToPickAWorkspace } from "../../utils/highLevelCommandHelper";
import { processAbortedError } from "../../utils/pluginError";
import { wasAskCliInstalled } from "../../utils/askCliHelper";

const COMMAND_NAME = EXTENSION_CONFIG.DEFAULT_PREFIX + '.' + OPERATION.HIGH_LEVEL.DIALOG.EXTENSION_REGISTERED_NAME;
const REPLAY_MODE = 'Replay mode';
const INTERACTIVE_MODE = 'Interactive mode';

const modeOptions: vscode.QuickPickItem[] = [
    <vscode.QuickPickItem> {
        label: REPLAY_MODE,
        description: 'Use replay mode, please input a file that contains a recorded session.'
    },
    <vscode.QuickPickItem> {
        label: INTERACTIVE_MODE,
        description: 'Start interactive dialog with Alexa, use special command "!quit" to exit this mode.'
    },
];

export const dialog = vscode.commands.registerCommand(COMMAND_NAME, async () => {
    if (!await wasAskCliInstalled()) {
        return;
    }
    if (!doesWorkSpaceExist()) {
        await askUserToPickAWorkspace(ERROR_AND_WARNING.CHECK_WORKSPACE_EXISTS.DEPLOY_AND_RELATED_ERROR_MESSAGE);
        return;
    }
    const dialogCommand = await initializeHighLevelCommandWithProfile(OPERATION.HIGH_LEVEL.DIALOG.COMMAND);
    if (!dialogCommand) {
        return;
    }
    await chooseMode(dialogCommand);
    CommandRunner.runCommand(dialogCommand);
});

async function addLocales(command: ICommand) {
    const localesList: string[]|undefined = await getLocalsFromCurrentWorkspace();
    if (!localesList || localesList.length === 0) {
        throw processAbortedError('No interaction model files are found in the current workspace');
    }
    const pickedLocale = await vscode.window.showQuickPick(localesList);
    if (!pickedLocale) {
        throw processAbortedError('Missing locale');
    }
    command.commandParameters!.set('locale', pickedLocale);
}

async function addReplay(command: ICommand) {
    const options: vscode.OpenDialogOptions = {
        'canSelectMany': false,
        'openLabel': 'Upload',
        'canSelectFiles': true,
        'canSelectFolders': false,
        'defaultUri': vscode.workspace.workspaceFolders? vscode.workspace.workspaceFolders[0].uri : undefined
    };
    const replayFilePath = await vscode.window.showOpenDialog(options);
    if (!replayFilePath || replayFilePath.length === 0) {
        throw processAbortedError('Missing replay file');
    }
    command.commandParameters!.set('replay', replayFilePath[0].fsPath);
}

async function chooseMode(command: ICommand) {
    const pickedMode = await vscode.window.showQuickPick(modeOptions, <vscode.QuickPickOptions> {
        placeHolder: 'Please choose a mode',
        ignoreFocusOut: true
    });
    if (!pickedMode) {
        throw processAbortedError('Missing Mode');
    }
    if(pickedMode.label === REPLAY_MODE){
        await addReplay(command);
    } else {
        await addLocales(command);
    }
    
}