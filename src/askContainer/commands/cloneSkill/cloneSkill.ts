/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import * as fs from 'fs';
import * as fsExtra from 'fs-extra';
import * as path from 'path';
import * as vscode from 'vscode';
import { TELEMETRY_EVENTS } from '../../../constants';
import { logAskError } from '../../../exceptions';
import { Logger } from '../../../logger';
import { SkillInfo } from '../../../models/types';
import { AbstractCommand, CommandContext, SmapiResource, Utils } from '../../../runtime';
import { ActionType, TelemetryClient } from '../../../runtime/lib/telemetry';
import { getSkillNameFromLocales } from '../../../utils/skillHelper';
import { openWorkspaceFolder } from '../../../utils/workspaceHelper';
import { CloneHostedSkillManager } from './cloneHostedSkillManager';
import { CloneNonHostedSkillManager } from './cloneNonHostedSkillManager';


export class CloneSkillCommand extends AbstractCommand<void> {
    constructor(commandName?: string) {
        super(commandName ?? 'askContainer.skillsConsole.cloneSkill');
    }

    async execute(context: CommandContext, skillInfo: SmapiResource<SkillInfo>): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}, args: `, skillInfo);
        const telemetryEventName =
        skillInfo.data.isHosted === true
            ? TELEMETRY_EVENTS.CLONE_HOSTED_SKILL_TELEMETRY_EVENT
            : TELEMETRY_EVENTS.CLONE_SELF_HOSTED_SKILL_TELEMETRY_EVENT;
        const action = TelemetryClient.getInstance().startAction(telemetryEventName, ActionType.EVENT);
        try {
            const skillFolderUri = await this.createSkillFolder(skillInfo);
            if (skillFolderUri === undefined) {
                return;
            }
            const cloneSkillManager =
                skillInfo.data.isHosted === true
                    ? new CloneHostedSkillManager(context.extensionContext, skillInfo, skillFolderUri.fsPath)
                    : new CloneNonHostedSkillManager(context.extensionContext, skillInfo, skillFolderUri.fsPath);

            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: 'Downloading skill',
                    cancellable: false,
                },
                async progress => {
                    await cloneSkillManager.cloneSkill(progress);
                }
            );

            const skillName = getSkillNameFromLocales(skillInfo.data.skillSummary.nameByLocale!);
            const lambdaCodeMsg =
                skillInfo.data.isHosted === true
                    ? ''
                    : 'This is not an Alexa-hosted skill, ASK Toolkit supports downloading and deploying a skill package but does not support these operations for Lambda code.';
            const cloneSkillMsg = `Skill ${skillName} was cloned successfully and added to workspace. The skill is located at ${skillFolderUri.fsPath}. ${lambdaCodeMsg}`;

            Logger.info(cloneSkillMsg);
            void vscode.window.showInformationMessage(cloneSkillMsg);
            await TelemetryClient.getInstance().store(action);
            await openWorkspaceFolder(skillFolderUri);
        } catch (error) {
            await TelemetryClient.getInstance().store(action, error);
            throw logAskError(`Skill clone failed`, error, true);
        }
    }

    async createSkillFolder(skillInfo: SmapiResource<SkillInfo>): Promise<vscode.Uri | undefined> {
        Logger.verbose(`Calling method: createSkillFolder`);
        const selectedFolderArray = await vscode.window.showOpenDialog({
            openLabel: 'Select project folder',
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
        });
        if (selectedFolderArray === undefined) {
            return undefined;
        }

        const projectFolder = selectedFolderArray[0];
        const skillName = getSkillNameFromLocales(skillInfo.data.skillSummary.nameByLocale!);
        const filteredProjectName = Utils.filterNonAlphanumeric(skillName);
        const skillFolderAbsPath = path.join(projectFolder.fsPath, filteredProjectName);

        if (fs.existsSync(skillFolderAbsPath)) {
            Logger.debug(`Skill folder ${skillFolderAbsPath} already exists.`);
            const errorMessage = `Skill folder ${skillFolderAbsPath} already exists. Would you like to overwrite it?`;
            const overWriteSelection = await vscode.window.showInformationMessage(errorMessage, ...['Yes', 'No']);
            if (overWriteSelection === 'Yes') {
                Logger.debug(`Confirmed skill folder overwrite option. Overwriting ${skillFolderAbsPath}.`);
                fsExtra.removeSync(skillFolderAbsPath);
            } else {
                return undefined;
            }
        }
        fs.mkdirSync(skillFolderAbsPath);
        return vscode.Uri.file(skillFolderAbsPath);
    }
}
