import * as vscode from "vscode";
import { ICommand } from "./commandRunner";
import {
    COMMAND_PARAMETERS,
    EXTENSION_CONFIG,
    VSCODE_SETTING_CONFIGURATION,
    ERROR_AND_WARNING
} from "./configuration";
import * as fs from "fs";
import * as path from "path";
import * as jsonfile from "jsonfile";
import * as R from "ramda";
const MANIFEST_PATH_TO_LOCALES = ['manifest', 'publishingInformation', 'locales'];
import { processAbortedError } from "./pluginError";
import { ProfileManager } from "./profileManager";
import { turnIProfileObjectIntoQuickPickItem } from "./commandParametersHelper";
const WAIT_TIME = 8000;

/**
 * Initialize the <ICommand> for the input command name with profile
 * @param {string} commandName
 * @return {Promise<ICommand>}
 */
export const initializeHighLevelCommandWithProfile = async (commandName: string) => {
    const initCommand =  <ICommand> {
        command: commandName,
        commandParameters: new Map<string, any>()
    };
    
    let cachedProfileList = await ProfileManager.getProfileList();
    if (cachedProfileList.length === 0) {
        ProfileManager.showProfileMissingAndSetupNotice();
        return;
    }

    const defaultProfile: string | undefined = vscode.workspace.getConfiguration(EXTENSION_CONFIG.DEFAULT_PREFIX)
        .get(VSCODE_SETTING_CONFIGURATION.PROFILE);
    
    if (defaultProfile) {
        initCommand.commandParameters!.set(COMMAND_PARAMETERS.PROFILE, defaultProfile);
    }
    else {
        const userInputProfile = await getProfile();
        // when the user hit 'Esc'
        if (typeof userInputProfile === 'undefined') {
            throw processAbortedError('No profile');
        }
        initCommand.commandParameters!.set(COMMAND_PARAMETERS.PROFILE, userInputProfile);
    }
    return initCommand;
};

/**
 * Get the list of locales bases on files name under models in the skill project.
 * @return {Promise<string[]|undefined>}
 */
export const getLocalsFromCurrentWorkspace = async () => {
    if (!vscode.workspace.workspaceFolders) {
        return undefined;
    }
    const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const skillPath = path.join(rootPath, 'skill.json');
    if (!fs.existsSync(skillPath)) {
        return undefined;
    }
    const skillManifest = jsonfile.readFileSync(skillPath);
    const localesObject = R.path(MANIFEST_PATH_TO_LOCALES, skillManifest);
    return R.keys(localesObject);
};



export async function openAsWorkspaceWhenDirectoryCreated(dirName?: string) {
    // Note: cannot use 'vscode.openFolder' here 
    // since while it opens in the window, vscode will also shutdown the current extension host process
    // that's why if there's no workspace, extension should only throw error and notify the user.
    const fileWatchWorkSpace = vscode.workspace.workspaceFolders![0].uri.fsPath;
    

    // three booleans are ignoreCreate, ignoreChange, ignoreDelete
    const fileWatcher =  vscode.workspace.createFileSystemWatcher(
        path.join(fileWatchWorkSpace, '*'),
        false,
        true,
        true
    );
    // if no event was trigger within 8 secs, this listener should be disposed.
    // this would reduce the risk of process retry caused event mismatch.
    setTimeout(() => {
        fileWatcher.dispose();
    }, WAIT_TIME);

    // when the folder created, the file still in download/preprocess stage. need to wait 8 sec
    // if jump into the directory right away, the process will be killed.
    fileWatcher.onDidCreate(async (e) => {
        if (dirName) {
            const createdDir = e.fsPath.split(path.sep).pop();
            if (createdDir === dirName && fs.lstatSync(e.fsPath).isDirectory()) {
                fileWatcher.dispose();
                setTimeout(async () => {
                    await vscode.commands.executeCommand('vscode.openFolder', e);
                }, WAIT_TIME);
            }
        } else {
            if (fs.lstatSync(e.fsPath).isDirectory()) {
                fileWatcher.dispose();
                setTimeout(async () => {
                    await vscode.commands.executeCommand('vscode.openFolder', e);
                }, WAIT_TIME);
            }
        }
    });
    
}

export function formatSkillName(inputName: string) {
    return inputName.trim().replace(/[\W_]+/g, '-');
}

/**
 * ask the user to pick a profile from the cached profile list and return the profile name
 */
async function getProfile() {
    const cachedProfileList = await ProfileManager.getProfileList();
    const quickPickProfileList = <vscode.QuickPickItem[]> cachedProfileList.map(turnIProfileObjectIntoQuickPickItem);
    const userInputProfile = await vscode.window.showQuickPick(quickPickProfileList, <vscode.QuickPickOptions> {
        placeHolder: ERROR_AND_WARNING.QUICK_PICK_PLACE_HOLDER,
        ignoreFocusOut: true
    });
    return userInputProfile ? userInputProfile.label : undefined;
}

export function doesWorkSpaceExist() {
    if (!vscode.workspace.workspaceFolders || !vscode.workspace.workspaceFolders[0]) {
        return false;
    }
    return true;
}

export async function askUserToPickAWorkspace(errorMessage: string) {
    const userChoice = await vscode.window.showErrorMessage(errorMessage, ERROR_AND_WARNING.CHECK_WORKSPACE_EXISTS.BUTTON_MESSAGE);
    if (userChoice === ERROR_AND_WARNING.CHECK_WORKSPACE_EXISTS.BUTTON_MESSAGE) {
        const userChoseWorkSpace = await vscode.window.showOpenDialog({
            "canSelectFiles": false,
            "canSelectFolders": true,
            "canSelectMany": false
        });
        if (!userChoseWorkSpace) {
            throw processAbortedError('Cannot find a workspace to create the skill project');
        }
        await vscode.commands.executeCommand('vscode.openFolder', userChoseWorkSpace[0]);
    }
}