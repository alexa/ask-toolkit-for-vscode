import * as fs from 'fs';
import * as path from 'path';
import * as R from 'ramda';
import * as vscode from 'vscode';

import { CloneSkillTemplate } from './cloneSkillTemplate';
import { createSkillPackageFolder, syncSkillPackage } from '../skillPackageHelper';
import { SKILL_FOLDER, DEFAULT_PROFILE } from '../../constants';
import { Logger } from '../../logger';
import { SkillInfo } from '../../models/types';
import { SmapiResource, Utils } from '../../runtime';

export class CloneOtherSkill extends CloneSkillTemplate {

    async cloneSkill(
        skillInfo: SmapiResource<SkillInfo>, targetPath: string, context: vscode.ExtensionContext, 
        progressBar?: vscode.Progress<{message: string; increment: number}>): Promise<void> {
        Logger.verbose(`Calling method: cloneSkill, args: `, skillInfo, targetPath);

        if (skillInfo.data.isHosted === true) {
            return;
        }
        const incrAmount: number = !progressBar ? 0 : 25;

        fs.mkdirSync(path.join(targetPath, SKILL_FOLDER.HIDDEN_ASK_FOLDER));
        const profile = Utils.getCachedProfile(context) ?? DEFAULT_PROFILE;

        this.createAskResourcesConfig(
            targetPath, profile, skillInfo.data.skillSummary.skillId!);
        this.createAskStateConfig(
            targetPath, profile, skillInfo.data.skillSummary.skillId!);
        if (progressBar) {
            progressBar.report({
                increment: incrAmount,
                message: 'Skill metadata files checked. Checking skill package...'
            });
        }

        createSkillPackageFolder(targetPath);
        if (progressBar) {
            progressBar.report({
                increment: incrAmount,
                message: 'Skill package created. Syncing from service...'
            });
        }

        const skillPkgPath = path.join(targetPath, SKILL_FOLDER.SKILL_PACKAGE.NAME);
        const skillPackageStatus = await syncSkillPackage(skillPkgPath, skillInfo, context);
        this.postCloneOtherSkill(targetPath, profile, skillPackageStatus.skill?.eTag);
        if (progressBar) {
            progressBar.report({
                increment: incrAmount,
                message: "Skill package sync'd."
            });
        }
    }

    createAskResourcesConfig(
        projectPath: string, profile: string, skillId: string): void {

        super.createAskResourcesConfig(projectPath, profile, skillId);
        const askResourcesPath = path.join(projectPath, SKILL_FOLDER.ASK_RESOURCES_JSON_CONFIG);
        let askResourcesJson = R.clone(JSON.parse(fs.readFileSync(askResourcesPath, 'utf-8')));
        askResourcesJson = R.set(
            R.lensPath(['profiles', profile, 'skillMetadata', 'src']), './skill-package', askResourcesJson);
        fs.writeFileSync(askResourcesPath, JSON.stringify(askResourcesJson, null, 2));
    }

    private postCloneOtherSkill(
        projectPath: string, profile: string, etag?: string) {
            Logger.verbose(`Calling method: postCloneOtherSkill, args: `, projectPath, profile, etag);
        this.addEtagToAskStatus(projectPath, profile, etag);
    }

    private addEtagToAskStatus(
        projectPath: string, profile: string, etag?: string) {
        Logger.verbose(`Calling method: addEtagToAskStatus`, projectPath, profile, etag);
        const askStatesPath = path.join(projectPath, SKILL_FOLDER.HIDDEN_ASK_FOLDER, SKILL_FOLDER.ASK_STATES_JSON_CONFIG);
        let askStatesJson = R.clone(JSON.parse(fs.readFileSync(askStatesPath, 'utf-8')));
        askStatesJson = R.set(
            R.lensPath(['profiles', profile, 'skillMetadata', 'etag']), etag, askStatesJson);
        fs.writeFileSync(askStatesPath, JSON.stringify(askStatesJson, null, 2));
    }
}