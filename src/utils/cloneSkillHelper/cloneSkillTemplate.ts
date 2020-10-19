import * as fs from 'fs';
import * as fsExtra from 'fs-extra';
import * as path from 'path';
import * as R from 'ramda';
import * as vscode from 'vscode';

import { SKILL_FOLDER, BASE_STATES_CONFIG, BASE_RESOURCES_CONFIG } from '../../constants';
import { AskError, loggableAskError } from '../../exceptions';
import { Logger } from '../../logger';
import { SkillInfo } from '../../models/types';
import { CommandContext, SmapiResource, Utils } from '../../runtime';
import { getSkillNameFromLocales } from '../skillHelper';
import { openWorkspaceFolder } from '../workspaceHelper';

export class CloneSkillTemplate {
    
    async executeClone(context: CommandContext, skillInfo: SmapiResource<SkillInfo>): Promise<void> {
        Logger.verbose(`Calling method: executeClone, args: `, skillInfo);
        try {
            const skillFolderUri = await this.createSkillFolder(skillInfo);
            if (skillFolderUri === undefined) {
                return;
            }
            // Create progress bar and run next steps
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Downloading skill",
                cancellable: false
            }, async (progress) => {
                await this.cloneSkill(
                    skillInfo, skillFolderUri.fsPath,
                    context.extensionContext, progress);
            });
            const skillName = getSkillNameFromLocales(skillInfo.data.skillSummary.nameByLocale!);
            const cloneSkillMsg = `Skill ${skillName} was cloned successfully and added to workspace. The skill is located at ${skillFolderUri.fsPath}`;
    
            Logger.info(cloneSkillMsg);
            void vscode.window.showInformationMessage(cloneSkillMsg);
    
            // Add skill folder to workspace
            await openWorkspaceFolder(skillFolderUri);
            return;
        } catch (err) {
            throw loggableAskError(`Skill clone failed`, err, true);
        }
    }
    
    async createSkillFolder(skillInfo: SmapiResource<SkillInfo>): Promise<vscode.Uri | undefined> {
        Logger.verbose(`Calling method: createSkillFolder, args: `, skillInfo);
        const selectedFolderArray = await vscode.window.showOpenDialog(
            {
                openLabel: 'Select project folder',
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false
            }
        );
        if (selectedFolderArray === undefined) {
            return undefined;
        }
    
        const projectFolder = selectedFolderArray[0];
        const skillName = getSkillNameFromLocales(
            skillInfo.data.skillSummary.nameByLocale!);
        const filteredProjectName = Utils.filterNonAlphanumeric(skillName);
        const skillFolderAbsPath = path.join(projectFolder.fsPath, filteredProjectName);
    
        // create skill folder in project path
        if (fs.existsSync(skillFolderAbsPath)) {
            Logger.debug(`Skill folder ${skillFolderAbsPath} already exists.`);
            const errorMessage = `Skill folder ${skillFolderAbsPath} already exists. Would you like to overwrite it?`;
            const overWriteSelection = await vscode.window.showInformationMessage(errorMessage, ...['Yes', 'No']);
            if (overWriteSelection === 'Yes') {
                Logger.debug(`Confirmed skill folder overwrite option. Overwriting ${skillFolderAbsPath}.`);
                fsExtra.removeSync(skillFolderAbsPath);
            }
            else {
                return undefined;
            }
        }
    
        fs.mkdirSync(skillFolderAbsPath);
    
        return vscode.Uri.file(skillFolderAbsPath);
    }
    
    createAskResourcesConfig(
        projectPath: string, profile: string, skillId: string): void {
        Logger.verbose(`Calling method: createAskResourcesConfig, args: `, projectPath, profile, skillId);
        
        const askResourcesPath = path.join(projectPath, SKILL_FOLDER.ASK_RESOURCES_JSON_CONFIG);
    
        let askResourcesJson = R.clone(BASE_RESOURCES_CONFIG);
        askResourcesJson = R.set(
            R.lensPath(['profiles', profile, 'skillId']), skillId, askResourcesJson);
        fs.writeFileSync(askResourcesPath, JSON.stringify(askResourcesJson, null, 2));
        }
    
    createAskStateConfig(
        projectPath: string, profile: string, skillId: string): void {
        Logger.verbose(`Calling method: createAskStateConfig, args: `, projectPath, profile, skillId);
        const askStatesPath = path.join(projectPath, SKILL_FOLDER.HIDDEN_ASK_FOLDER, SKILL_FOLDER.ASK_STATES_JSON_CONFIG);
    
        let askStatesJson = R.clone(BASE_STATES_CONFIG);
        askStatesJson = R.set(
            R.lensPath(['profiles', profile, 'skillId']), skillId, askStatesJson);
        fs.writeFileSync(askStatesPath, JSON.stringify(askStatesJson, null, 2));
    }

    cloneSkill(
        skillInfo: SmapiResource<SkillInfo>, targetPath: string, context: vscode.ExtensionContext, 
        progressBar?: vscode.Progress<{message: string; increment: number}>): Promise<void> {
            throw new AskError('cloneSkill() must be implemented');
        }

}