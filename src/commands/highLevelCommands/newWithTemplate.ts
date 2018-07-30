'use strict';
import * as vscode from "vscode";
import { CommandRunner } from "../../utils/commandRunner";
import { EXTENSION_CONFIG, OPERATION, ERROR_AND_WARNING } from "../../utils/configuration";
import { initializeHighLevelCommandWithProfile, openAsWorkspaceWhenDirectoryCreated, formatSkillName, doesWorkSpaceExist, askUserToPickAWorkspace } from "../../utils/highLevelCommandHelper";
import * as request from "request-promise";
import * as R from "ramda";
import { processAbortedError } from "../../utils/pluginError";
import { wasAskCliInstalled } from "../../utils/askCliHelper";

const S3_ENDPOINT = 'https://s3.amazonaws.com/ask-cli/templates.json';
const COMMAND_NAME = EXTENSION_CONFIG.DEFAULT_PREFIX + '.' + OPERATION.HIGH_LEVEL.NEW_TEMPLATE.EXTENSION_REGISTERED_NAME;

export const newWithTemplate = vscode.commands.registerCommand(COMMAND_NAME, async () => {
    if (!await wasAskCliInstalled()) {
        return;
    }
    if (!doesWorkSpaceExist()) {
        await askUserToPickAWorkspace(ERROR_AND_WARNING.CHECK_WORKSPACE_EXISTS.CREATE_CLONE_ERROR_MESSAGE);
        return;
    }
    let skillFolderName: string | undefined;
    const newTemplateCommand = await initializeHighLevelCommandWithProfile(OPERATION.HIGH_LEVEL.NEW_TEMPLATE.COMMAND);
    if (!newTemplateCommand) {
        return;
    }
    const templateJson = await getTemplateJson(S3_ENDPOINT);
    const templateList = generateQuickPickItemsListFromTemplate(templateJson);
    const pickedTemplate = await pickTemplate(templateList);
    newTemplateCommand.commandParameters!.set('template', pickedTemplate);

    skillFolderName = await getSkillName();
    if (skillFolderName) {
        skillFolderName = formatSkillName(skillFolderName);
        newTemplateCommand.commandParameters!.set('skill-name', skillFolderName);
    } else {
        skillFolderName = formatSkillName(pickedTemplate);
    }

    await openAsWorkspaceWhenDirectoryCreated(skillFolderName);
    CommandRunner.runCommand(newTemplateCommand);
});

async function getTemplateJson(url: string) {
    let headers: any = {};
    headers['User-Agent'] = 'ask-vscode-extension';
    const params = {
        url: url,
        method: 'GET',
        headers: headers
    };
    
    try {
        const response = await request(params);
        return JSON.parse(response);
    } catch (error) {
        throw new Error('Cannot retrieve template list.' + error.message);
    }
}

function generateQuickPickItemsListFromTemplate(templateObject: any) {
    return R.map(
        (templateName) => {
            return <vscode.QuickPickItem> {
                label: templateName
            };
        },
        R.keys(templateObject).sort()
    );
}


async function pickTemplate(templateList: vscode.QuickPickItem[]) {
    const pickedTemplate = await vscode.window.showQuickPick(templateList);
    if (!pickedTemplate) {
        throw processAbortedError('Didn\'t choose any template');
    }
    return pickedTemplate.label;
    
}

async function getSkillName() {
    return await vscode.window.showInputBox({
        prompt: 'Please input the skill name or use the default one by hitting "Enter"'
    });
}
