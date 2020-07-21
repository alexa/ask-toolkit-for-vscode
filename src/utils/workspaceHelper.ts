import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../logger';
import { loggableAskError } from '../exceptions';
import { disposeWebviews } from './webViews/viewManager';
import { EXTENSION_STATE_KEY, SKILL_FOLDER } from '../constants';
import { onWorkspaceOpenEventEmitter } from '../askContainer/events';

export function doesWorkSpaceExist(): boolean {
    Logger.verbose('Calling method: doesWorkSpaceExist');
    if (!vscode.workspace.workspaceFolders || !vscode.workspace.workspaceFolders[0]) {
        return false;
    }
    return true;
}

export function doesMultipleFoldersExist(): boolean {
    Logger.verbose('Calling method: doesMultipleFoldersExist');
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 1) {
        return true;
    }
    return false;
}

export async function findSkillFoldersInWs(): Promise<vscode.Uri[]> {
    Logger.verbose('Calling method: findSkillFolders');
    const askResources = await vscode.workspace.findFiles('**/ask-resources.json');
    const skillFolders: vscode.Uri[] = [];
    askResources.forEach(resourceFileUri => {
        skillFolders.push(vscode.Uri.file(path.dirname(resourceFileUri.fsPath)));
    });
    return skillFolders;
}

export function getSkillFolderInWs(context: vscode.ExtensionContext): vscode.Uri | undefined {
    Logger.verbose('Calling method: getSkillFolderInWs');
    const skillFolders: vscode.Uri[] | undefined = context.workspaceState.get(EXTENSION_STATE_KEY.WS_SKILLS);
    if (doesWorkSpaceExist() && skillFolders) {
        return skillFolders.length > 0 ? skillFolders[0] : undefined;
    }
    return;
}

export function setSkillContext() {
    vscode.commands.executeCommand('setContext', 'inSkillWorkspace', true);
}

export function unsetSkillContext() {
    vscode.commands.executeCommand('setContext', 'inSkillWorkspace', false);
}

export async function openWorkspaceFolder(workspaceUri: vscode.Uri): Promise<void> {
    Logger.verbose('Calling method: openWorkspaceFolder');
    disposeWebviews();
    for (const textDocument of vscode.workspace.textDocuments) {
        await vscode.window.showTextDocument(textDocument.uri, {preview: true, preserveFocus: false});
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    }
    // Disable skill actions view before opening new skill
    unsetSkillContext();

    vscode.commands.executeCommand('workbench.view.explorer');
    const openFolders = vscode.workspace.workspaceFolders;
    vscode.workspace.updateWorkspaceFolders(0, openFolders ? openFolders.length : 0, { uri: workspaceUri });
}