import * as fs from 'fs-extra';
import * as path from 'path';
import * as model from 'ask-smapi-model';
import { ExtensionContext, Progress } from 'vscode';

import { AbstractCreateSkillManager } from './abstractCreateSkillManager';
import { createSkillWebViewType } from './createSkillWebview';
import {
    DEFAULT_PROFILE,
    MASTER_BRANCH_SKILL_MANIFEST_URL,
    MASTER_BRANCH_SKILL_MODELS_URL,
    SKILL_FOLDER,
    TEMPLATES,
} from '../../../constants';
import { loggableAskError } from '../../../exceptions';
import { Logger } from '../../../logger';
import { AskStates } from '../../../models/resourcesConfig/askStates';
import { AskResources } from '../../../models/resourcesConfig/askResource';
import { Manifest } from '../../../models/manifest';
import { getHash } from '../../../utils/hashHelper';
import { downloadToFileFromUrl } from '../../../utils/urlHandlers';
import { GitInTerminalHelper } from '../../../utils/gitHelper';
import { getSkillMetadataSrc } from '../../../utils/skillHelper';
import { deploySkillPackage, pollImportStatus } from '../../../utils/skillPackageHelper';

import ImportResponse = model.v1.skill.ImportResponse;

const SKILL_TEMPLATE_DEFAULT_IM_FILENAME = 'en-US.json';
const FILE_MODE = '777';
const TEMPLATE_EXTRA_FILES = [
    '.git',
    '.gitignore',
    '.github',
    'README.md',
    'CODE_OF_CONDUCT.md',
    'CONTRIBUTING.md',
    'LICENSE.txt',
    'LICENSE',
    'NOTICE',
    'instructions',
    'getting-started.png'
];

export class CreateNonHostedSkillManager extends AbstractCreateSkillManager {
    askResources: AskResources | undefined;
    askStates: AskStates | undefined;

    constructor(context: ExtensionContext, skillFolder: string) {
        super(context, skillFolder);
    }

    async createSkill(userInput: createSkillWebViewType, progress: Progress<any>) {
        Logger.verbose(`Calling method: createSkill, args: `, userInput);
        try {
            const incrAmt = 25;
            progress.report({
                increment: incrAmt,
                message: 'Downloading the skill template...',
            });

            this.cloneSkillTemplate(userInput);
            await this.updateSkillTemplate(userInput.skillName, userInput.locale);

            progress.report({
                increment: incrAmt,
                message: 'Skill template downloaded. Importing the skill package to the Alexa service...',
            });

            const importResponse = await this.createSkillPackage(progress, incrAmt);
            const skillId = importResponse?.skill?.skillId;
            const eTag = importResponse?.skill?.eTag;

            if (skillId === undefined) {
                throw loggableAskError('SkillId is not found in the import skill package status response');
            }

            progress.report({
                increment: incrAmt,
                message: 'Skill created. Updating local resources...',
            });
            await this.postCreateSkill(skillId, eTag);
        } catch (error) {
            throw loggableAskError('Failed to create a self-hosted skill', error);
        }
    }

    private cloneSkillTemplate(userInput: createSkillWebViewType) {
        Logger.verbose(`Calling method: cloneSkillTemplate, args: `, userInput);
        const gitHelper = new GitInTerminalHelper(this.skillFolder, Logger.logLevel);
        const templateUrl = TEMPLATES.TEMPLATES_BY_CODE_LANGUAGE[userInput.language];
        const branch =
            userInput.language === 'Java' ? TEMPLATES.TEMPLATE_ASK_TOOLS_BRANCH : TEMPLATES.TEMPLATE_ASK_CLI_BRANCH;
        gitHelper.clone(templateUrl, branch, this.skillFolder);
    }

    private async updateSkillTemplate(skillName: string, locale: string): Promise<void> {
        Logger.verbose(`Calling method: updateSkillTemplate, args: `, skillName, locale);
        // skill manifest
        await this.updateSkillManifest(locale, skillName);
        // IM
        await this.updateInteractionModels(locale);
        // AskResources
        this.updateAskResources();
        // remove git and github files
        this.removeGitRelatedFiles();
        // remove assets
        const assestsFolder = path.join(
            this.skillFolder,
            SKILL_FOLDER.SKILL_PACKAGE.NAME,
            SKILL_FOLDER.SKILL_PACKAGE.ASSETS
        );
        fs.removeSync(assestsFolder);
    }

    private async updateSkillManifest(locale: string, skillName: string) {
        Logger.verbose(`Calling method: updateSkillManifest, args: `, locale, skillName);
        const manifestFilePath = path.join(
            this.skillFolder,
            SKILL_FOLDER.SKILL_PACKAGE.NAME,
            SKILL_FOLDER.SKILL_PACKAGE.MANIFEST
        );
        await downloadToFileFromUrl(manifestFilePath, MASTER_BRANCH_SKILL_MANIFEST_URL, FILE_MODE);
        const manifest = new Manifest(this.skillFolder, SKILL_FOLDER.SKILL_PACKAGE.NAME);

        const locales = manifest.getPublishingLocales();
        const sampleLocale = locales[locale] ?? Object.values(locales)[0];
        manifest.setPublishingLocales(undefined);
        manifest.setPublishingLocale(locale, sampleLocale);
        manifest.setSkillName(skillName, locale);
        manifest.setAPIsCustom({});
        manifest.write();
    }

    private async updateInteractionModels(locale: string) {
        Logger.verbose(`Calling method: updateInteractionModels, args: `, locale);
        const oldIM = path.join(
            this.skillFolder,
            SKILL_FOLDER.SKILL_PACKAGE.NAME,
            SKILL_FOLDER.SKILL_PACKAGE.CUSTOM_MODELS,
            SKILL_TEMPLATE_DEFAULT_IM_FILENAME
        );
        const newIM = path.join(
            this.skillFolder,
            SKILL_FOLDER.SKILL_PACKAGE.NAME,
            SKILL_FOLDER.SKILL_PACKAGE.CUSTOM_MODELS,
            locale + '.json'
        );
        fs.renameSync(oldIM, newIM);
        const IMUrl = `${MASTER_BRANCH_SKILL_MODELS_URL}/${locale}.json`;
        try {
            await downloadToFileFromUrl(newIM, IMUrl, FILE_MODE);
        } catch (error) {
            return;
        }
    }

    private updateAskResources() {
        this.askResources = new AskResources(this.skillFolder);
        const defaultProfileObject = this.askResources.getProfile(DEFAULT_PROFILE);
        this.askResources.setProfile(DEFAULT_PROFILE, undefined);
        this.askResources.setProfile(this.profile, defaultProfileObject);
        this.askResources.write();
    }

    private removeGitRelatedFiles() {
        Logger.verbose(`Calling method: removeGitRelatedFiles`);
        TEMPLATE_EXTRA_FILES.forEach((filename) => {
            try {
                const filePath = path.join(this.skillFolder,filename);
                void fs.remove(filePath);
            } catch (error) {
                throw loggableAskError(`Failed to remove a file in the skill template`, error);
            }
        })
    }

    private async createSkillPackage(progress: Progress<any>, incrAmt: number): Promise<ImportResponse | undefined> {
        Logger.verbose(`Calling method: createSkillPackage`);
        const importId = await deploySkillPackage(this.context, this.skillFolder);
        progress.report({
            increment: incrAmt,
            message: 'Polling the creation status...',
        });
        return pollImportStatus(importId, this.context);
    }

    private async postCreateSkill(skillId: string, eTag?: string) {
        Logger.verbose(`Calling method: postCreateSkill, args: `, skillId, eTag);
        this.askStates = new AskStates(this.skillFolder);
        this.askStates.setSkillId(this.profile, skillId);
        if (eTag !== undefined) {
            this.askStates.setSkillMetaETag(this.profile, eTag);
        }
        const { skillPackageAbsPath } = getSkillMetadataSrc(this.skillFolder, this.profile);
        const deployHash = await getHash(skillPackageAbsPath);
        this.askStates.setSkillMetaLastDeployHash(this.profile, deployHash.hash);
        this.askStates.write();
        this.askResources!.setSkillId(this.profile, skillId);
        this.askResources!.write();
    }
}
