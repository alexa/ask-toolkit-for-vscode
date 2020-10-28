import * as vscode from 'vscode';
import { Logger } from '../logger';
import { loggableAskError } from '../exceptions';
import { ERRORS, SIMULATOR_MESSAGE_TYPE } from '../constants';
import { IViewport } from "apl-suggester";
import { DEFAULT_VIEWPORT_CHARACTERISTICS } from "../aplContainer/utils/viewportProfileHelper";
import { getCurrentDate } from './dateHelper';
import { getSkillFolderInWs } from './workspaceHelper';
import { read, write } from '../runtime/lib/utils/jsonUtility';
import {isSkillEnabled, currentLocale} from './simulateMessageHelper';
import {aplDocument, aplDataSource} from './simulateSkillHelper';

export let aplViewport = DEFAULT_VIEWPORT_CHARACTERISTICS;

/**
 * Choose replay file then replay conversation automatically.
 */
export async function getReplayList(): Promise<void | Record<string, any>> {
    Logger.verbose(`Calling method: simulateReplayHelper.getReplayList`);

    const selectFileDialog = await vscode.window.showOpenDialog({
        "canSelectFiles": true,
        "canSelectFolders": false,
        "canSelectMany": false,
        "filters": {
            "Json": ["json"]
        }
    });
    const filePath = selectFileDialog ? selectFileDialog[0].fsPath : '';
    if (filePath === '') {
        return;
    }
    let inputList = [];
    try {
        const jsonObject = read(filePath);
        inputList = jsonObject.userInput;
        const locale = jsonObject.locale;
        if (isSkillEnabled === false) {
            void vscode.window.showErrorMessage(ERRORS.REPLAY_FAILED_ENABLE);
            return;
        }
        else if (locale !== currentLocale) {
            void vscode.window.showErrorMessage(ERRORS.REPLAY_FAILED_LOCALE);
            return;
        }
        else if (inputList.length <= 0) {
            void vscode.window.showErrorMessage(ERRORS.REPLAY_FAILED);
            return;
        }
    } catch (err) {
        throw loggableAskError(ERRORS.OPEN_REPLAY_FILE_FAIL(filePath), err, true);
    }

    const returnMessage: Record<string, any> = ({
        replay: inputList,
        type: SIMULATOR_MESSAGE_TYPE.REPLAY
    });
    return returnMessage;
}

/**
 * Export utterances of the current session for replay.
 * @param webviewMessage message sent from Webview
 * @param skillId Alexa Skill ID
 */
export async function exportFileForReplay(message: Record<string, any>, skillId: string, skillName: string, context: vscode.ExtensionContext): Promise<void> {
    Logger.verbose(`Calling method: simulateReplayHelper.exportFileForReplay`);

    if (message.exportUtterance === undefined || message.exportUtterance.length <= 0) {
        void vscode.window.showWarningMessage(ERRORS.EXPORT_FAILED);
        return;
    }
    const exportContent = {
        skillId,
        locale: message.skillLocale,
        userInput: message.exportUtterance
    }

    const dateToday = getCurrentDate();
    skillName = skillName.replace(' ', '');
    const locale = currentLocale;
    const skillLocale = locale.replace('-', '_').toLowerCase();
    const skillFolder = getSkillFolderInWs(context)?.fsPath;
    const fileName = vscode.Uri.file(skillFolder + '/' + skillName + '_' + skillLocale + '_' + dateToday);

    const saveFileDialog = await vscode.window.showSaveDialog({
        defaultUri: fileName,
        filters: {
            "Json": ["json"]
        }
    });

    if (saveFileDialog === undefined) {
        return;
    }
    const filePath = saveFileDialog.fsPath;
    write(filePath, exportContent);

    const saveFileMsg = 'Simulator success: The file was saved in ' + filePath;
    void vscode.window.showInformationMessage(saveFileMsg);
    return;
}

/**
 * Renew the aplViewport and send to webview.
 * @param new viewport
 * @returns object containing viewport type and document.
 */
export function getNewViewPortMessage(viewport: IViewport): Record<string, any> {
    Logger.verbose(`Calling method: simulateReplayHelper.getNewViewPortMessage`);
    aplViewport = viewport;
    return {
        newViewport: JSON.stringify(aplViewport),
        documents: aplDocument,
        dataSources: aplDataSource,
        type: SIMULATOR_MESSAGE_TYPE.VIEWPORT
    }
}
