/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import * as model from "ask-smapi-model";
import * as fs from "fs";
import * as path from "path";
import * as R from "ramda";
import * as vscode from "vscode";
import {
  CLI_HOSTED_SKILL_TYPE,
  DEFAULT_ENCODING,
  DEFAULT_PROFILE,
  EN_US_LOCALE,
  ERRORS,
  EXTENSION_STATE_KEY,
  SKILL,
  SKILL_FOLDER,
} from "../constants";
import {logAskError} from "../exceptions";
import {Logger} from "../logger";
import {SkillInfo} from "../models/types";
import {SmapiClientFactory, SmapiResource, Utils} from "../runtime";
import {getSkillFolderInWs} from "./workspaceHelper";

import hostedSkillMetadata = model.v1.skill.AlexaHosted.HostedSkillMetadata;
import SkillManifestEnvelope = model.v1.skill.Manifest.SkillManifestEnvelope;

export function getAskResourceConfig(folderPath: string): any {
  Logger.verbose(`Calling method: getAskResourceConfig`);
  if (folderPath === undefined) {
    throw logAskError("Workspace is not a valid skill project");
  }
  const askResourcesPath = path.join(folderPath, SKILL_FOLDER.ASK_RESOURCES_JSON_CONFIG);
  if (fs.existsSync(askResourcesPath)) {
    const skillConfigHex: any = fs.readFileSync(askResourcesPath);
    return JSON.parse(skillConfigHex);
  }
}

export function getSkillManifestFromWorkspace(skillFolder: vscode.Uri, profile: string): any {
  Logger.verbose(`Calling method: getSkillManifestFromWorkspace`);
  try {
    if (skillFolder === undefined) {
      throw logAskError("Workspace is not a valid skill project");
    }
    const {skillPackageAbsPath} = getSkillMetadataSrc(skillFolder.fsPath, profile);
    const skillManifestPath = path.join(skillPackageAbsPath, SKILL_FOLDER.SKILL_PACKAGE.MANIFEST);
    if (fs.existsSync(skillManifestPath)) {
      const skillConfigHex: any = fs.readFileSync(skillManifestPath);
      return JSON.parse(skillConfigHex);
    }
  } catch (error) {
    throw logAskError("Failed to get skill manifest", error);
  }
}

export function getSkillMetadataSrc(folderPath: string, profile: string): {skillPackageAbsPath: string; skillPackageSrc: string} {
  Logger.verbose(`Calling method: getSkillMetadataSrc`);
  const skillResource = getAskResourceConfig(folderPath);
  const skillType: string | undefined = R.path(["profiles", profile, "skillInfrastructure", "type"], skillResource);
  const isHosted = skillType === CLI_HOSTED_SKILL_TYPE;
  let skillPackageAbsPath: string | undefined;
  let skillPackageSrc: string | undefined;
  if (isHosted) {
    skillPackageAbsPath = path.join(folderPath, SKILL_FOLDER.SKILL_PACKAGE.NAME);
    skillPackageSrc = SKILL_FOLDER.SKILL_PACKAGE.NAME;
    return {skillPackageAbsPath, skillPackageSrc};
  }
  skillPackageSrc = R.path(["profiles", profile, "skillMetadata", "src"], skillResource);
  if (skillPackageSrc === undefined) {
    throw logAskError(
      "Failed to get skill package path in ask-resources.json, please specify 'src' field in 'skillMetadata' under your profile name.",
    );
  }
  skillPackageAbsPath = path.join(folderPath, skillPackageSrc);
  if (!fs.existsSync(skillPackageAbsPath)) {
    throw logAskError(`The skill package path ${skillPackageSrc} does not exist. \
        Please check the skill package path in the 'src' field in 'skillMetadata' under your profile name.`);
  }
  return {skillPackageAbsPath, skillPackageSrc};
}

export function getAskState(skillFolder: vscode.Uri): any {
  Logger.verbose(`Calling method: getAskState`);
  if (skillFolder === undefined) {
    throw logAskError("Workspace is not a valid skill project");
  }
  const askStatePath = path.join(skillFolder.fsPath, SKILL_FOLDER.HIDDEN_ASK_FOLDER, SKILL_FOLDER.ASK_STATES_JSON_CONFIG);
  if (fs.existsSync(askStatePath)) {
    const skillStateHex = fs.readFileSync(askStatePath, DEFAULT_ENCODING);
    return JSON.parse(skillStateHex);
  }
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
    const skillConfig = getAskResourceConfig(skillFolder.fsPath);
    const skillState = getAskState(skillFolder);
    const profile = Utils.getCachedProfile(context) ?? DEFAULT_PROFILE;

    const skillId: string =
      R.path(["profiles", profile, "skillId"], skillState) ?? R.path(["profiles", profile, "skillId"], skillConfig) ?? "";

    const skillJson = getSkillManifestFromWorkspace(skillFolder, profile);
    const localesInfo = skillJson.manifest.publishingInformation.locales;

    const skillName = getSkillNameFromLocales(localesInfo, undefined);
    const defaultLocale = getDefaultSkillLocale(localesInfo).replace("-", "_");

    if (!Utils.isNonBlankString(skillId)) {
      Logger.error("Failed to get the skill id.");
    }
    return {
      skillId,
      skillName,
      defaultLocale,
    };
  }
  throw logAskError("Workspace does not contain a valid skill project");
}

interface LocalesInfoType {
  [key: string]:
    | string
    | {
        name: string;
      };
}

export function getSkillNameFromLocales(localesInfo: LocalesInfoType, locale?: string): string {
  Logger.verbose(`Calling method: getSkillNameFromLocales, args:`, localesInfo, locale);
  if (locale !== undefined) {
    const skillName = localesInfo[locale];
    if (skillName === undefined) {
      throw logAskError(`Get skill name error for provided locale: ${locale}`);
    }
    return typeof skillName === "string" ? skillName : skillName.name;
  } else {
    let skillName;
    if (localesInfo[EN_US_LOCALE] !== undefined) {
      skillName = localesInfo[EN_US_LOCALE];
    } else {
      skillName = Object.values(localesInfo)[0];
    }
    if (skillName === undefined || (typeof skillName === "string" && skillName.length === 0)) {
      throw logAskError("Get skill name error. Skill name should not be empty");
    }
    return typeof skillName === "string" ? skillName : skillName.name;
  }
}

export function getDefaultSkillLocale(localesInfo: LocalesInfoType): string {
  if (localesInfo[EN_US_LOCALE] !== undefined) {
    return EN_US_LOCALE;
  } else {
    return Object.keys(localesInfo)[0];
  }
}

export function checkProfileSkillAccess(context: vscode.ExtensionContext): void {
  Logger.verbose(`Calling method: checkProfileSkillAccess`);
  const currentProfile = Utils.getCachedProfile(context) ?? "default";
  const skillProfile = getSkillProfile(context);
  if (currentProfile !== skillProfile) {
    throw logAskError(`${ERRORS.SKILL_ACCESS(currentProfile, skillProfile)}`);
  }
  return;
}

export function getSkillProfile(context: vscode.ExtensionContext): string {
  Logger.verbose(`Calling method: getSkillProfile`);
  const skillConfig = getAskResourceConfig(getSkillFolderInWs(context)!.fsPath);
  return Object.keys(skillConfig["profiles"])[0];
}

export function getCachedSkills(context: vscode.ExtensionContext, profile?: string): Array<SmapiResource<SkillInfo>> | undefined {
  Logger.verbose(`Calling method: getCachedSkills, args:`, profile);
  profile = profile ?? Utils.getCachedProfile(context);

  if (profile === undefined) {
    throw logAskError("ASK Profile unavailable. Please sign in first!!");
  }

  const allSkills: Record<string, Array<SmapiResource<SkillInfo>>> = context.globalState.get(EXTENSION_STATE_KEY.CACHED_SKILLS, {});
  return allSkills[profile];
}

export function setCachedSkills(context: vscode.ExtensionContext, skillsList: Array<SmapiResource<SkillInfo>>, profile?: string): void {
  Logger.verbose(`Calling method: setCachedSkills, args:`, skillsList, profile);
  profile = profile ?? Utils.getCachedProfile(context);

  if (profile === undefined) {
    throw logAskError("ASK Profile unavailable. Please sign in first!!");
  }

  const allSkills: Record<string, Array<SmapiResource<SkillInfo>>> = context.globalState.get(
    // eslint-disable-next-line no-undef
    EXTENSION_STATE_KEY.CACHED_SKILLS,
    {},
  );

  allSkills[profile] = skillsList;

  void context.globalState.update(EXTENSION_STATE_KEY.CACHED_SKILLS, allSkills);
}

export function clearCachedSkills(context: vscode.ExtensionContext, profile?: string): void {
  Logger.verbose(`Calling method: clearCachedSkills, args:`, profile);
  profile = profile ?? Utils.getCachedProfile(context);

  if (profile === undefined) {
    throw logAskError("ASK Profile unavailable. Please sign in first!!");
  }

  const allSkills: Record<string, Array<SmapiResource<SkillInfo>>> = context.globalState.get(
    // eslint-disable-next-line no-undef
    EXTENSION_STATE_KEY.CACHED_SKILLS,
    {},
  );
  delete allSkills[profile];

  void context.globalState.update(EXTENSION_STATE_KEY.CACHED_SKILLS, allSkills);
}

export async function getHostedSkillMetadata(skillId: string, context: vscode.ExtensionContext): Promise<hostedSkillMetadata | undefined> {
  Logger.verbose(`Calling method: isSkillHosted, args:`, skillId);
  const profile = Utils.getCachedProfile(context) ?? DEFAULT_PROFILE;
  try {
    const skillMetadata: hostedSkillMetadata = await SmapiClientFactory.getInstance(profile, context).getAlexaHostedSkillMetadataV1(
      skillId,
    );
    return skillMetadata;
  } catch (err) {
    Logger.verbose("Unable to get hosted skill metadata", err);
    return undefined;
  }
}

export async function getSkillMetadata(
  skillId: string,
  stage: string,
  context: vscode.ExtensionContext,
): Promise<SkillManifestEnvelope | undefined> {
  Logger.verbose(`Calling method: getSkillMetadata, args:`, skillId, stage);
  const profile = Utils.getCachedProfile(context) ?? DEFAULT_PROFILE;
  try {
    const skillMetadata: SkillManifestEnvelope = await SmapiClientFactory.getInstance(profile, context).getSkillManifestV1(skillId, stage);
    return skillMetadata;
  } catch (err) {
    Logger.verbose("Unable to get skill metadata", err);
    throw err;
  }
}

/**
 * Return the locales for which the skill has a corresponding interaction model available
 * @param profile user profile
 * @param skillId Alexa Skill ID
 * @param context VSCode extension context
 */
export async function getAvailableLocales(
  profile: string,
  skillId: string,
  context: vscode.ExtensionContext,
): Promise<Record<string, string[]>> {
  try {
    const skillManifestEnvelope: model.v1.skill.Manifest.SkillManifestEnvelope = await SmapiClientFactory.getInstance(
      profile,
      context,
    ).getSkillManifestV1(skillId, SKILL.STAGE.DEVELOPMENT);
    const localesArray = skillManifestEnvelope.manifest?.publishingInformation?.locales;
    const availableLocales: string[] = localesArray ? Object.keys(localesArray) : [];

    return {availableLocales};
  } catch (err) {
    Logger.error(err);
    if (err.statusCode === 401) {
      const profile = Utils.getCachedProfile(context) ?? DEFAULT_PROFILE;
      throw logAskError(ERRORS.PROFILE_ERROR(profile), true);
    } else {
      throw logAskError(err.message, true);
    }
  }
}
