import { SKILL } from '../constants';
import { Options } from 'async-retry';
import { view, lensPath } from 'ramda';
import retry = require('async-retry'); 
import * as model from 'ask-smapi-model';
import { SmapiClientFactory } from '../runtime';
import { ExtensionContext } from 'vscode';

import { Logger } from '../logger';
import { loggableAskError, AskError } from '../exceptions';

async function _pollSkillCreation(skillId: string, profile: string, context: ExtensionContext): Promise<any> {
    // The maximum waiting time:
    // Math.min(minTimeout * Math.pow(1.2, 30), maxTimeout) ~= 8min
    // which is the same with create self hosted skill.
    const retryOptions: Options = {
        retries: 30,
        minTimeout: 2000,
        factor: 1.2
    };
    const response: any = {
        manifest: {},
        interactionModel: {},
        provisioning: {},
    };

    await retry(async (bail: (err: Error) => void, attempt: number) => {
        Logger.verbose(`retrying skill creation polling, attempt: ${attempt}`);
        const skillStatus: any = await SmapiClientFactory.getInstance(profile, context).getSkillStatusV1(skillId);
        let buildDetails;

        response.manifest.status = view(lensPath([SKILL.RESOURCES.MANIFEST,
            'lastUpdateRequest', 'status']), skillStatus);
        response.manifest.errors = view(lensPath([SKILL.RESOURCES.MANIFEST,
            'lastUpdateRequest', 'errors']), skillStatus);

        if (skillStatus[SKILL.RESOURCES.INTERACTION_MODEL]) {
            const locale = Object.keys(skillStatus[SKILL.RESOURCES.INTERACTION_MODEL])[0];
            response.interactionModel.status = view(lensPath([SKILL.RESOURCES.INTERACTION_MODEL,
                locale, 'lastUpdateRequest', 'status']), skillStatus);
            response.interactionModel.errors = view(lensPath([SKILL.RESOURCES.INTERACTION_MODEL,
                locale, 'lastUpdateRequest', 'errors']), skillStatus);
            buildDetails = view(lensPath([SKILL.RESOURCES.INTERACTION_MODEL, locale,
                'lastUpdateRequest', 'buildDetails']), skillStatus);
        }

        response.provisioning.status = view(lensPath([SKILL.RESOURCES.HOSTED_SKILL_PROVISIONING,
            'lastUpdateRequest', 'status']), skillStatus);

        if (!response.manifest.status && !response.provisioning.status && !response.interactionModel.status) {
            return response;
        }

        if (response.manifest.status === SKILL.MANIFEST_STATUS.FAILURE
            || response.provisioning.status === SKILL.PROVISIONING_STATUS.FAILURE
            || (response.interactionModel.status === SKILL.INTERACTION_MODEL_STATUS.FAILURE && buildDetails)
            || (response.provisioning.status === SKILL.PROVISIONING_STATUS.SUCCESS
                && response.manifest.status === SKILL.MANIFEST_STATUS.SUCCESS
                && response.interactionModel.status === SKILL.INTERACTION_MODEL_STATUS.SUCCESS)) {
            return response;
        }
        const skillNotCreatedMsg = 'skill not yet created';
        Logger.verbose(skillNotCreatedMsg);
        throw new AskError(skillNotCreatedMsg);
    }, retryOptions);
}

function _getManifest(skillName: string, locale: string): model.v1.skill.Manifest.SkillManifest {
    const manifest: model.v1.skill.Manifest.SkillManifest = {
        publishingInformation: {
            locales: {
                [locale]: {
                    name: skillName
                }
            }
        },
        apis: {
            custom: {
            }
        }
    };
    return manifest;
}

export async function createSkill(skillName: string, runtime: string, region: string, locale: string, profile: string, vendorId: string, context: ExtensionContext): Promise<string> {
    Logger.verbose(
        `Calling method: createSkill, args: `, {
            "skillName": skillName,
            "runtime": runtime,
            "region": region,
            "locale": locale,
            "profile": profile,
            "vendorId": vendorId
        });
    const payload = {
        vendorId: vendorId,
        manifest: _getManifest(skillName, locale),
        hosting: {
            "alexaHosted": {
                "runtime": runtime,
                "region": region
            }
        }
    } as model.v1.skill.CreateSkillRequest;
    const createSkillResponse = 
        await SmapiClientFactory.getInstance(profile, context).createSkillForVendorV1(payload);
    const skillId = createSkillResponse.skillId as string;
    await _pollSkillCreation(skillId, profile, context);
    return skillId;
}