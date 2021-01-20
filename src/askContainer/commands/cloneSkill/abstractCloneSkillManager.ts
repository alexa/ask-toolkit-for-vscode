import * as path from 'path';
import * as vscode from 'vscode';

import { CLI_HOSTED_SKILL_TYPE, SKILL_FOLDER, DEFAULT_PROFILE } from '../../../constants';
import { Logger } from '../../../logger';
import { AskStates } from '../../../models/resourcesConfig/askStates';
import { AskResources } from '../../../models/resourcesConfig/askResource';
import { SkillInfo } from '../../../models/types';
import { SmapiResource, Utils } from '../../../runtime';
import { getHash } from '../../../utils/hashHelper';

export abstract class AbstractCloneSkillManager {
    profile: string;
    context: vscode.ExtensionContext;
    skillInfo: SmapiResource<SkillInfo>;
    fsPath: string;
    askResourcesPath: string;
    askStatesPath: string;

    constructor(context: vscode.ExtensionContext, skillInfo: SmapiResource<SkillInfo>, fsPath: string) {
        this.context = context;
        const profile = Utils.getCachedProfile(this.context);
        this.profile = profile ?? DEFAULT_PROFILE;
        this.skillInfo = skillInfo;
        this.fsPath = fsPath;
        this.askResourcesPath = path.join(this.fsPath, SKILL_FOLDER.ASK_RESOURCES_JSON_CONFIG);
        this.askStatesPath = path.join(
            this.fsPath,
            SKILL_FOLDER.HIDDEN_ASK_FOLDER,
            SKILL_FOLDER.ASK_STATES_JSON_CONFIG
        );
    }

    abstract async cloneSkill(progressBar: vscode.Progress<{ message: string; increment: number }>): Promise<void>;

    createAskResourcesConfig(isHosted: boolean): void {
        Logger.verbose(`Calling method: createAskResourcesConfig`);
        const askResources = new AskResources(this.fsPath);
        askResources.setSkillId(this.profile, this.skillInfo.data.skillSummary.skillId!)
        if (isHosted) {
            askResources.setSkillInfraType(this.profile, CLI_HOSTED_SKILL_TYPE);
        } else {
            askResources.setSkillMetaSrc(this.profile, SKILL_FOLDER.SKILL_PACKAGE.NAME);
        }
        askResources.write();
    }

    createAskStateConfig(): void {
        Logger.verbose(`Calling method: createAskStateConfig`);
        const askState = new AskStates(this.fsPath);
        askState.setSkillId(this.profile, this.skillInfo.data.skillSummary.skillId!);
        askState.write();
    }

    async postCloneSkill(isHosted: boolean, eTag?: string): Promise<void> {
        Logger.verbose(`Calling method: postCloneSkill, args: `, isHosted, eTag);
        const askState = new AskStates(this.fsPath);
        if (eTag !== undefined) {
            askState.setSkillMetaETag(this.profile, eTag);
        }
        if (isHosted === false) {
            const currentHash = await getHash(path.join(this.fsPath, SKILL_FOLDER.SKILL_PACKAGE.NAME));
            askState.setSkillMetaLastDeployHash(this.profile, currentHash.hash);
        }
        askState.write();
    }
}
