import * as vscode from "vscode";
import * as path from "path";

import { DEFAULT_PROFILE, SKILL, SKILL_FOLDER } from "../../../constants";
import { loggableAskError } from "../../../exceptions";
import { Logger } from "../../../logger";
import { AskStates } from '../../../models/resourcesConfig/askStates';
import { AbstractWebView, Utils } from "../../../runtime";
import { getSkillDetailsFromWorkspace } from "../../../utils/skillHelper";
import { deploySkillPackage, pollImportStatus } from "../../../utils/skillPackageHelper";

const WINDOW_PROCESS_TITLE_DEPLOYING = "Deploying skill";
const WINDOW_PROCESS_TITLE_BUILDING = "Deploying skill: Skill package build in progress";
const SKILL_PACKAGE_BUILD_STATUS_SUCCEEDED_MSG = "Skill package build succeeded";
const SKILL_PACKAGE_BUILD_STATUS_FAILED_MSG = "Skill package build failed";

export abstract class AbstractDeploySkillManager {
    protected profile: string;
    protected context: vscode.ExtensionContext;
    protected skillFolderWs: vscode.Uri;
    protected fsPath: string;
    protected skillId: string;
    protected askStatesPath: string;

    constructor(context: vscode.ExtensionContext, skillFolderWs: vscode.Uri) {
        this.profile = Utils.getCachedProfile(context) ?? DEFAULT_PROFILE;
        this.context = context;
        this.skillFolderWs = skillFolderWs;
        this.fsPath = skillFolderWs.fsPath;
        this.skillId = getSkillDetailsFromWorkspace(this.context).skillId;
        this.askStatesPath = path.join(
            this.fsPath,
            SKILL_FOLDER.HIDDEN_ASK_FOLDER,
            SKILL_FOLDER.ASK_STATES_JSON_CONFIG
        );
    }

    abstract async deploySkill(view: AbstractWebView, isForce: boolean): Promise<void>;

    async deploySkillPackage(view: AbstractWebView, isForce?: boolean, eTag?: string, currentHash?: string): Promise<void> {
        let importId: string;
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: WINDOW_PROCESS_TITLE_DEPLOYING,
                cancellable: false,
            },
            async () => {
                const skillId = getSkillDetailsFromWorkspace(this.context).skillId;
                importId = await deploySkillPackage(
                    this.context,
                    this.fsPath,
                    skillId,
                    isForce === true ? undefined : eTag
                );
            }
        );

        void vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: WINDOW_PROCESS_TITLE_BUILDING,
                cancellable: false,
            },
            async () => {
                try {
                    const importResponse = await pollImportStatus(importId, this.context);
                    // do not support deploying a live non-hosted skill
                    this.postDeploySkill(SKILL.STAGE.DEVELOPMENT, importResponse?.skill?.eTag, currentHash);
                    Logger.info(SKILL_PACKAGE_BUILD_STATUS_SUCCEEDED_MSG);
                    void vscode.window.showInformationMessage(SKILL_PACKAGE_BUILD_STATUS_SUCCEEDED_MSG);
                } catch (err) {
                    throw loggableAskError(SKILL_PACKAGE_BUILD_STATUS_FAILED_MSG, err, true);
                } finally {
                    view.dispose();
                }
            }
        );
    }

    postDeploySkill(stage: string, eTag?: string, deployHash?: string): void {
        Logger.debug(`Calling method: AbstractDeploySkillManager.postDeploySkill, args: `, stage, eTag, deployHash);
        const askStates = new AskStates(this.fsPath);
        if (eTag !== undefined) {
            if (stage === SKILL.STAGE.DEVELOPMENT) {
                askStates.setSkillMetaETag(this.profile, eTag);
            }
        } else {
            Logger.error("Cannot fetch the skill package eTag");
        }
        // Hosted skills do not use last deploy hash to track difference but use git.
        if (deployHash !== undefined) {
            askStates.setSkillMetaLastDeployHash(this.profile, deployHash);
        }
        askStates.write();
    }
}
