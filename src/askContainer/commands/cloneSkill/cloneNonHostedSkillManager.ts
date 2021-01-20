import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import { AbstractCloneSkillManager } from './abstractCloneSkillManager';
import { createSkillPackageFolder, syncSkillPackage } from '../../../utils/skillPackageHelper';
import { SKILL, SKILL_FOLDER } from '../../../constants';
import { Logger } from '../../../logger';

export class CloneNonHostedSkillManager extends AbstractCloneSkillManager {
    async cloneSkill(progressBar: vscode.Progress<{ message: string; increment: number }>): Promise<void> {
        Logger.verbose(`Calling method: cloneSkill, args: `, progressBar);

        const incrAmount = 25;
        fs.mkdirSync(path.join(this.fsPath, SKILL_FOLDER.HIDDEN_ASK_FOLDER));
        this.createAskResourcesConfig(false);
        this.createAskStateConfig();
        progressBar.report({
            increment: incrAmount,
            message: 'Skill metadata files created. Checking skill package...',
        });

        createSkillPackageFolder(this.fsPath);
        progressBar.report({
            increment: incrAmount,
            message: 'Skill package created. Syncing from service...',
        });

        const skillPkgPath = path.join(this.fsPath, SKILL_FOLDER.SKILL_PACKAGE.NAME);
        const skillPackageStatus = await syncSkillPackage(skillPkgPath, this.skillInfo.data.skillSummary.skillId!, this.context, SKILL.STAGE.DEVELOPMENT);
        void this.postCloneSkill(false, skillPackageStatus.skill?.eTag);
        progressBar.report({
            increment: incrAmount,
            message: 'Skill package synced.',
        });
    }
}
