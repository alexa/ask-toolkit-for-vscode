'use strict';
import * as vscode from "vscode";
import { CommandRunner, ICommand } from "../../utils/commandRunner";
import { EXTENSION_CONFIG, OPERATION, ERROR_AND_WARNING } from "../../utils/configuration";
import { initializeHighLevelCommandWithProfile, getLocalsFromCurrentWorkspace, doesWorkSpaceExist, askUserToPickAWorkspace } from "../../utils/highLevelCommandHelper";
import { processAbortedError } from "../../utils/pluginError";
import { wasAskCliInstalled } from "../../utils/askCliHelper";

const COMMAND_NAME = EXTENSION_CONFIG.DEFAULT_PREFIX + '.' + OPERATION.HIGH_LEVEL.SIMULATE.EXTENSION_REGISTERED_NAME;
const CURRENT_ACTIVE_WINDOW = 'Active text editor';
const CHOOSE_FROM_A_FILE = 'Choose from a file';
const TYPE_IN_UTTERANCE = 'Type in Utterance';
const inputOptions: vscode.QuickPickItem[] = [
    <vscode.QuickPickItem> {
        label: CURRENT_ACTIVE_WINDOW,
        description: 'Use the content from the current active window as the input source.'
    },
    <vscode.QuickPickItem> {
        label: TYPE_IN_UTTERANCE,
        description: 'Allow the user to type in the simulation utterance text.'
    },
    <vscode.QuickPickItem> {
        label: CHOOSE_FROM_A_FILE,
        description: 'Show a file open dialog which allows to select a file as the input source.'
    }
];


export const simulate = vscode.commands.registerCommand(COMMAND_NAME, async () => {
    if (!await wasAskCliInstalled()) {
        return;
    }
    if (!doesWorkSpaceExist()) {
        await askUserToPickAWorkspace(ERROR_AND_WARNING.CHECK_WORKSPACE_EXISTS.DEPLOY_AND_RELATED_ERROR_MESSAGE);
        return;
    }
    const simulateCommand = await initializeHighLevelCommandWithProfile(OPERATION.HIGH_LEVEL.SIMULATE.COMMAND);
    if (!simulateCommand) {
        return;
    }
    await addLocales(simulateCommand);
    await addInputUtterance(simulateCommand);
    CommandRunner.runCommand(simulateCommand);
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

async function addInputUtterance (command: ICommand) {
    const pickedOption: vscode.QuickPickItem | undefined = await vscode.window.showQuickPick(inputOptions);
    if (!pickedOption) {
        throw processAbortedError('Missing simulate utterances');
    }

    switch (pickedOption.label) {
        case CURRENT_ACTIVE_WINDOW: 
            await handleInputFromActiveTextEditor(command);
            break;
        case TYPE_IN_UTTERANCE: 
            await handleInputFromTypeInUtterance(command);
            break;
        case CHOOSE_FROM_A_FILE:
            await handleInputFromChosenFile(command);        
    }
}

async function handleInputFromActiveTextEditor(command: ICommand) {
    if (!vscode.window.activeTextEditor) {
        throw processAbortedError('Missing active text editor');
    }
    command.commandParameters!.set('file', vscode.window.activeTextEditor.document.uri.fsPath);
}

async function handleInputFromChosenFile(command: ICommand) {
    const pickedFile = await vscode.window.showOpenDialog({
        canSelectMany: false,
        canSelectFolders: false,
        openLabel: 'Input simulate utterance'
    });
    if (!pickedFile || pickedFile.length === 0) {
        throw processAbortedError('Missing input simulate utterance file');
    }
    command.commandParameters!.set('file', pickedFile[0].fsPath);
}

async function handleInputFromTypeInUtterance(command: ICommand) {
    const simulateUtteranceText = await vscode.window.showInputBox({
        prompt: 'Please input the simulate utterance',
        validateInput: (input: string) => {
            return input.trim().length === 0 ? 'Utterance cannot be empty' : undefined;
        }
    });
    if (!simulateUtteranceText || !simulateUtteranceText.trim()) {
        throw processAbortedError('No input simulate utterance text');
    }
    command.commandParameters!.set('text', simulateUtteranceText);
}