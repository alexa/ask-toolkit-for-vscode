import * as fs from "fs-extra";
import * as path from "path";
import * as vscode from "vscode";

import { BRANCH_TO_STAGE, DEFAULT_PROFILE, SKILL, SKILL_FOLDER } from "../../constants";
import { AskError, loggableAskError } from "../../exceptions";
import { AskStates } from '../../models/resourcesConfig/askStates';
import { AbstractCommand, CommandContext, Utils } from "../../runtime";
import { Logger } from "../../logger";
import { getCurrentDate } from "../../utils/dateHelper";
import { GitInTerminalHelper, getOrInstantiateGitApi } from "../../utils/gitHelper";
import { getHash } from "../../utils/hashHelper";
import { getHostedSkillMetadata, getSkillDetailsFromWorkspace, getSkillMetadataSrc } from "../../utils/skillHelper";
import { syncSkillPackage } from "../../utils/skillPackageHelper";
import { getSkillFolderInWs } from "../../utils/workspaceHelper";
import { zipDirectory } from "../../utils/zipHelper";
export class ExportSkillPackageCommand extends AbstractCommand<boolean> {
    constructor() {
        super("ask.exportSkillPackage");
    }

    async execute(context: CommandContext): Promise<boolean> {
        Logger.debug(`Calling method: ${this.commandName}`);
        try {
            const skillFolder = getSkillFolderInWs(context.extensionContext);
            if (skillFolder === undefined) {
                throw loggableAskError("No skill folder found in the workspace");
            }
            let profile = Utils.getCachedProfile(context.extensionContext);
            profile = profile ?? DEFAULT_PROFILE;
            const skillDetails = getSkillDetailsFromWorkspace(context.extensionContext);
            const skillId = skillDetails.skillId;
            const hostedSkillMetadata = await getHostedSkillMetadata(skillId, context.extensionContext);
            const isHostedSkill = hostedSkillMetadata !== undefined;
            const { skillPackageAbsPath, skillPackageSrc }= getSkillMetadataSrc(skillFolder.fsPath, profile);
            if (isHostedSkill) {
                const gitApi = await getOrInstantiateGitApi(context.extensionContext);
                if (gitApi === undefined) {
                    throw loggableAskError("No git extension found.");
                }
                const skillRepo = gitApi.getRepository(skillFolder);
                if (skillRepo === null) {
                    throw loggableAskError("No skill repository found.");
                }
            }

            const errorMessage = `Exporting the skill package from the Developer Console will overwrite the local skill package. The local skill package will be copied in a backed up folder in the root directory. Would you like to continue exporting skill package?`;
            const overWriteSelection = await vscode.window.showWarningMessage(errorMessage, ...["Yes", "No"]);
            if (overWriteSelection === "Yes") {
                Logger.debug(`Confirmed skill package overwrite option`);

                const { skillPkgBackupZipPath, skillPackageStatus } = await this.exportSkillPackage(
                    context.extensionContext,
                    skillFolder,
                    skillPackageAbsPath,
                    skillPackageSrc,
                    skillId
                );
                void this.setAskState(profile, skillFolder, skillPackageAbsPath, isHostedSkill, skillPackageStatus.skill?.eTag);
                
                if (isHostedSkill) {
                    GitInTerminalHelper.addFilesToIgnore(skillFolder.fsPath, [SKILL_FOLDER.BACK_UP]);
                }
                void vscode.window.showInformationMessage(
                    `Skill package has been downloaded. The backup file has been created at ${skillPkgBackupZipPath}.`
                );
                void vscode.commands.executeCommand("workbench.view.explorer");
                return true;
            }
            return false;
        } catch (error) {
            throw loggableAskError("Export skill package failed", error, true);
        }
    }

    private async exportSkillPackage(
        extensionContext: vscode.ExtensionContext,
        skillFolder: vscode.Uri,
        skillPackageAbsPath: string,
        skillPackageSrc: string,
        skillId: string
    ) {
        Logger.verbose(`Calling method: ${this.commandName}.exportSkillPackage, args:`, skillFolder, skillId);
        const backupPath = path.join(skillFolder.fsPath, SKILL_FOLDER.BACK_UP);
        if (!fs.existsSync(backupPath)) {
            fs.mkdirSync(backupPath);
        }
        fs.readdirSync(backupPath).forEach(file => {
            const regex = new RegExp(`^${skillPackageSrc}-[0-9]+\.zip$`);
            if (regex.test(file)) {
                fs.removeSync(path.join(backupPath, file));
            }
        });
        const skillPkgBackupZipPath = path.join(backupPath, `${skillPackageSrc}-${getCurrentDate()}.zip`);
        zipDirectory(skillPackageAbsPath, skillPkgBackupZipPath);
        const skillPackageStatus = await syncSkillPackage(skillPackageAbsPath, skillId, extensionContext);
        return { skillPkgBackupZipPath, skillPackageStatus };
    }

    private async setAskState(
        profile: string,
        skillFolder: vscode.Uri,
        skillPackagePath: string,
        isHostedSkill: boolean,
        eTag?: string
    ): Promise<void> {
        Logger.verbose(`Calling method: ${this.commandName}.setAskState, args:`, skillFolder, eTag);
        const askStates = new AskStates(skillFolder.fsPath);
        if (eTag !== undefined) {
            askStates.setSkillMetaETag(profile, eTag);
        } else {
            Logger.error("Fail to fetch the skill package eTag.");
        }

        if (isHostedSkill === false) {
            const deployHash = await getHash(skillPackagePath);
            askStates.setSkillMetaLastDeployHash(profile, deployHash.hash);
        }

        askStates.write();
    }
}
