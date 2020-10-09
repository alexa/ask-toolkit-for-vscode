import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as R from 'ramda';
import * as model from 'ask-smapi-model';

import { SmapiResource, Utils, SmapiClientFactory } from '../runtime';

import { loggableAskError } from '../exceptions';
import { getSkillFolderInWs } from './workspaceHelper';
import {
    EXTENSION_STATE_KEY, EN_US_LOCALE, DEFAULT_ENCODING,
    DEFAULT_PROFILE, ERRORS, SKILL_FOLDER, SKILL
} from '../constants';
import { SkillInfo } from '../models/types';
import { Logger } from '../logger';

import hostedSkillMetadata = model.v1.skill.AlexaHosted.HostedSkillMetadata;

export function getAskResourceConfig(skillFolder: vscode.Uri): any {
    Logger.verbose(`Calling method: getAskResourceConfig`);
    if (skillFolder) {
        const askResourcesPath = path.join(
            skillFolder.fsPath, SKILL_FOLDER.ASK_RESOURCES_JSON_CONFIG);
        if (fs.existsSync(askResourcesPath)) {
            const skillConfigHex: any = fs.readFileSync(askResourcesPath);
            return JSON.parse(skillConfigHex);
        }
    }
    throw loggableAskError('Workspace is not a valid skill project');
}

export function getSkillManifestFromWorkspace(skillFolder: vscode.Uri): any {
    Logger.verbose(`Calling method: getSkillManifestFromWorkspace`);
    if (skillFolder) {
        const skillManifestPath = path.join(
            skillFolder.fsPath, SKILL_FOLDER.SKILL_PACKAGE.NAME, SKILL_FOLDER.SKILL_PACKAGE.MANIFEST);
        if (fs.existsSync(skillManifestPath)) {
            const skillConfigHex: any = fs.readFileSync(skillManifestPath);
            return JSON.parse(skillConfigHex);
        }
    }
    throw loggableAskError('Workspace is not a valid skill project');
}

function getAskState(skillFolder: vscode.Uri): any {
    Logger.verbose(`Calling method: getAskState`);
    if (skillFolder) {
        const askStatePath = path.join(
            skillFolder.fsPath, SKILL_FOLDER.HIDDEN_ASK_FOLDER, SKILL_FOLDER.ASK_STATES_JSON_CONFIG);
        if (fs.existsSync(askStatePath)) {
            const skillStateHex = fs.readFileSync(askStatePath, DEFAULT_ENCODING);
            return JSON.parse(skillStateHex);
        }
    }
    throw loggableAskError('Workspace is not a valid skill project');
}

export interface SkillDetailsType {
    skillId: string;
    skillName: string;
    defaultLocale: string;
}

export function getSkillDetailsFromWorkspace(context: vscode.ExtensionContext, locale = EN_US_LOCALE): SkillDetailsType {
    Logger.verbose(`Calling method: getSkillDetailsFromWorkspace`);
    const skillFolder = getSkillFolderInWs(context);
    if (skillFolder) {
        const skillConfig = getAskResourceConfig(skillFolder);
        const skillState = getAskState(skillFolder);
        const profile = Utils.getCachedProfile(context) ?? DEFAULT_PROFILE;

        let skillId: string | undefined = R.path(['profiles', profile, 'skillId'], skillState)
            || R.path(['profiles', profile, 'skillId'], skillConfig);

        const skillJson = getSkillManifestFromWorkspace(skillFolder);
        const localesInfo = skillJson.manifest.publishingInformation.locales;

        const skillName = getSkillNameFromLocales(localesInfo, undefined);
        const defaultSkillLocale = getDefaultSkillLocale(localesInfo).replace('-', '_');

        if (!Utils.isNonBlankString(skillId)) {
            Logger.error('Failed to get the skill id.');
        }
        return {
            skillId: skillId ?? '',
            skillName: skillName,
            defaultLocale: defaultSkillLocale
        };
    }
    throw loggableAskError('Workspace does not contain a valid skill project');
}

interface LocalesInfoType {
    [key: string]: string | {
        name: string;
    };
}

export function getSkillNameFromLocales(localesInfo: LocalesInfoType, locale?: string): string {
    Logger.verbose(`Calling method: getSkillNameFromLocales, args:`, localesInfo, locale);
    if (locale) {
        const skillName = localesInfo[locale];
        if (!skillName) {
            throw loggableAskError(`Get skill name error for provided locale: ${locale}`);
        }
        return typeof skillName === 'string' ? skillName : skillName.name;
    } else {
        let skillName;
        if (localesInfo[EN_US_LOCALE]) {
            skillName = localesInfo[EN_US_LOCALE];
        } else {
            skillName = Object.values(localesInfo)[0];
        }
        if (!skillName || (typeof skillName === 'string' && skillName.length === 0)) {
            throw loggableAskError('Get skill name error. Skill name should not be empty');
        }
        return typeof skillName === 'string' ? skillName : skillName.name;
    }
}

export function getDefaultSkillLocale(localesInfo: LocalesInfoType): string {
    if (localesInfo[EN_US_LOCALE]) {
        return EN_US_LOCALE;
    } else {
        return Object.keys(localesInfo)[0];
    }
}

export function checkProfileSkillAccess(context: vscode.ExtensionContext): void {
    Logger.verbose(`Calling method: checkProfileSkillAccess`);
    const currentProfile = Utils.getCachedProfile(context) ?? 'default';
    const skillProfile = getSkillProfile(context);
    if (currentProfile !== skillProfile) {
        throw loggableAskError(
            `${ERRORS.SKILL_ACCESS(currentProfile, skillProfile)}`);
    }
    return;
}

export function getSkillProfile(context: vscode.ExtensionContext): string {
    Logger.verbose(`Calling method: getSkillProfile`);
    const skillConfig = getAskResourceConfig(getSkillFolderInWs(context)!);
    return Object.keys(skillConfig['profiles'])[0];
}

export function getCachedSkills(
    context: vscode.ExtensionContext, profile?: string): Array<SmapiResource<SkillInfo>> | undefined {
    Logger.verbose(`Calling method: getCachedSkills, args:`, profile);
    profile = profile ?? Utils.getCachedProfile(context);

    if (!profile) {
        throw loggableAskError('ASK Profile unavailable. Please sign in first!!');
    }

    const allSkills: Record<string, Array<SmapiResource<SkillInfo>>> = context.globalState.get(
        EXTENSION_STATE_KEY.CACHED_SKILLS, {});
    return allSkills[profile];
}

export function setCachedSkills(
    context: vscode.ExtensionContext, skillsList: Array<SmapiResource<SkillInfo>>,
    profile?: string): void {
    Logger.verbose(`Calling method: setCachedSkills, args:`, skillsList, profile);
    profile = profile ?? Utils.getCachedProfile(context);

    if (!profile) {
        throw loggableAskError('ASK Profile unavailable. Please sign in first!!');
    }

    const allSkills: Record<string, Array<SmapiResource<SkillInfo>>> = context.globalState.get(
        // eslint-disable-next-line no-undef
        EXTENSION_STATE_KEY.CACHED_SKILLS, {});

    allSkills[profile] = skillsList;

    context.globalState.update(EXTENSION_STATE_KEY.CACHED_SKILLS, allSkills);
}

export function clearCachedSkills(
    context: vscode.ExtensionContext, profile?: string): void {
    Logger.verbose(`Calling method: clearCachedSkills, args:`, profile);
    profile = profile ?? Utils.getCachedProfile(context);

    if (!profile) {
        throw loggableAskError('ASK Profile unavailable. Please sign in first!!');
    }

    const allSkills: Record<string, Array<SmapiResource<SkillInfo>>> = context.globalState.get(
        // eslint-disable-next-line no-undef
        EXTENSION_STATE_KEY.CACHED_SKILLS, {});
    delete allSkills[profile];

    context.globalState.update(EXTENSION_STATE_KEY.CACHED_SKILLS, allSkills);
}

export async function getHostedSkillMetadata(skillId: string, context: vscode.ExtensionContext): Promise<hostedSkillMetadata | undefined> {
    Logger.verbose(`Calling method: isSkillHosted, args:`, skillId);
    const profile = Utils.getCachedProfile(context) ?? DEFAULT_PROFILE;
    try {
        const skillMetadata: hostedSkillMetadata = await SmapiClientFactory.getInstance(
            profile, context).getAlexaHostedSkillMetadataV1(skillId);
        return skillMetadata;
    } catch (err) {
        Logger.verbose('Unable to get hosted skill metadata', err);
        return;
    }
}

/**
 * Return the locales for which the skill has a corresponding interaction model available
 * @param profile user profile
 * @param skillId Alexa Skill ID
 * @param context VSCode extension context
 */
export async function getAvailableLocales(profile: string, skillId: string, context: vscode.ExtensionContext): Promise<Record<string, string[]>> {
    try {
        const skillManifestEnvelope: model.v1.skill.Manifest.SkillManifestEnvelope =
            await SmapiClientFactory.getInstance(profile, context)
                .getSkillManifestV1(skillId, SKILL.STAGE.DEVELOPMENT);
        const localesArray = skillManifestEnvelope.manifest?.publishingInformation?.locales;
        const availableLocales: string[] = localesArray ? Object.keys(localesArray) : [];

        return ({ availableLocales });
    }
    catch (err) {
        Logger.error(err);
        if (err.statusCode === 401) {
            const profile = Utils.getCachedProfile(context) ?? DEFAULT_PROFILE;
            throw loggableAskError(ERRORS.PROFILE_ERROR(profile), true);
        }
        else {
            throw loggableAskError(err.message, true);
        }
    }
}