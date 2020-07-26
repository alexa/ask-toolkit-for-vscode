import * as vscode from 'vscode';
import * as fs from 'fs';
import * as fsExtra from 'fs-extra';
import * as path from 'path';
import {
    SmapiResource, AbstractCommand, CommandContext, Utils
} from '../../runtime';

import { SkillInfo } from '../../models/types';
import { getSkillNameFromLocales } from '../../utils/skillHelper';
import { cloneSkill } from '../../utils/cloneSkillHelper';
import { openWorkspaceFolder } from '../../utils/workspaceHelper';
import { Logger } from '../../logger';
import { loggableAskError } from '../../exceptions';

export class CloneSkillCommand extends AbstractCommand<void> {

    constructor() {
        super('askContainer.skillsConsole.cloneSkill');
    }

    async createSkillFolder(skillInfo: SmapiResource<SkillInfo>): Promise<vscode.Uri | undefined> {
        Logger.verbose(`Calling method: ${this.commandName}.createSkillFolder, args: `, skillInfo);
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
        const filteredProjectName = Utils.filterNonAlphanumeric(skillName)
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

    async execute(context: CommandContext, skillInfo: SmapiResource<SkillInfo>): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}, args: `, skillInfo);
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
            }, async (progress, token) => {
                await cloneSkill(
                    skillInfo, skillFolderUri.fsPath,
                    context.extensionContext, progress);
            });
            const skillName = getSkillNameFromLocales(skillInfo.data.skillSummary.nameByLocale!);
            const cloneSkillMsg = `Skill ${skillName} was cloned successfully and added to workspace. The skill is located at ${skillFolderUri.fsPath}`;

            Logger.info(cloneSkillMsg);
            vscode.window.showInformationMessage(cloneSkillMsg);

            // Add skill folder to workspace
            await openWorkspaceFolder(skillFolderUri);
            return;
        } catch (err) {
            throw loggableAskError(`Skill clone failed`, err, true);
        }
    }
}
