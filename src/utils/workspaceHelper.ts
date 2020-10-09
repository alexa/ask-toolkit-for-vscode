import * as vscode from 'vscode';
import * as path from 'path';
import { Logger } from '../logger';
import { disposeWebviews } from './webViews/viewManager';
import { EXTENSION_STATE_KEY, MULTIPLE_SKILLS_PRESENT_MSG } from '../constants';

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

export function setSkillContext(): void {
    void vscode.commands.executeCommand('setContext', 'inSkillWorkspace', true);
}

export function unsetSkillContext(): void {
    void vscode.commands.executeCommand('setContext', 'inSkillWorkspace', false);
}

async function openSkillInNewWorkspace(workspaceUri: vscode.Uri): Promise<void> {
    Logger.verbose('Calling method: openSkillInNewWorkspace');
    void await vscode.commands.executeCommand('vscode.openFolder', workspaceUri, true);
}

async function openSkillInCurrentWorkspace(workspaceUri: vscode.Uri): Promise<void> {
    Logger.verbose('Calling method: openSkillInCurrentWorkspace');
    disposeWebviews(true, true);
    for (const textDocument of vscode.workspace.textDocuments) {
        await vscode.window.showTextDocument(textDocument.uri, {preview: true, preserveFocus: false});
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    }
    // Disable skill actions view before opening new skill
    unsetSkillContext();

    void vscode.commands.executeCommand('workbench.view.explorer');
    vscode.workspace.updateWorkspaceFolders(0, 0, { uri: workspaceUri });
}

export async function openWorkspaceFolder(workspaceUri: vscode.Uri): Promise<void> {
    Logger.verbose('Calling method: openWorkspaceFolder');

    if ((await findSkillFoldersInWs()).length > 0) {
        Logger.debug('Current workspace already contains skills');
        const openInDifferentWs = 'Yes';
        const openInSameWs = 'No';
        const option = await vscode.window.showInformationMessage(
            MULTIPLE_SKILLS_PRESENT_MSG, openInDifferentWs, openInSameWs);
        if (option !== undefined && option === openInDifferentWs) {
            Logger.debug('Adding skill to a new workspace');
            await openSkillInNewWorkspace(workspaceUri);
        } else {
            Logger.debug('Adding skill to the current workspace');
            await openSkillInCurrentWorkspace(workspaceUri);
        }
    } else {
        Logger.debug('No skills found in the workspace. Adding skill to the current workspace');
        await openSkillInCurrentWorkspace(workspaceUri);
    }
}