import * as model from 'ask-smapi-model';
import * as retry from 'async-retry';
import { view, lensPath } from 'ramda';
import { ExtensionContext, Progress } from 'vscode';

import { AbstractCreateSkillManager } from './abstractCreateSkillManager';
import { createSkillWebViewType } from './createSkillWebview';
import { SKILL, SKILL_STATUS_MODEL } from '../../../constants';
import { loggableAskError } from '../../../exceptions';
import { SkillInfo } from '../../../models/types';
import { Logger } from '../../../logger';
import { SmapiClientFactory, SmapiResource, Utils } from '../../../runtime';
import { CloneHostedSkillManager } from '../../commands/cloneSkill/cloneHostedSkillManager';

const INCREMENT_NUMBER = 15;
export class CreateHostedSkillManager extends AbstractCreateSkillManager {
    vendorId: string;

    constructor(context: ExtensionContext, skillFolder: string) {
        super(context, skillFolder);
        try {
            this.vendorId = Utils.resolveVendorId(this.profile);
        } catch (err) {
            throw loggableAskError(`Failed to retrieve vendorID for profile ${this.profile}`);
        }
    }

    async createSkill(userInput: createSkillWebViewType, progress: Progress<any>) {
        Logger.verbose(`Calling method: createSkill, args: `, userInput, progress);
        try {
            progress.report({
                increment: INCREMENT_NUMBER,
                message: 'Creating an Alexa hosted skill...',
            });

            const skillId = await this.requestCreateSkill(userInput, progress);

            progress.report({
                increment: INCREMENT_NUMBER,
                message: 'Skill created. Cloning into the selected folder...',
            });

            await this.cloneSkill(skillId, userInput.skillName, progress);
        } catch (error) {
            throw loggableAskError('Failed to create a hosted skill', error);
        }
    }

    async requestCreateSkill(userInput: createSkillWebViewType, progress: Progress<any>): Promise<string> {
        Logger.verbose(`Calling method: createSkill, args: `, userInput, progress);
        const manifest = this.createManifest(userInput.skillName, userInput.locale);
        const payload = {
            vendorId: this.vendorId,
            manifest,
            hosting: {
                alexaHosted: {
                    runtime: userInput.runtime,
                    region: userInput.region,
                },
            },
        } as model.v1.skill.CreateSkillRequest;
        const createSkillResponse = await SmapiClientFactory.getInstance(
            this.profile,
            this.context
        ).createSkillForVendorV1(payload);

        progress.report({
            increment: INCREMENT_NUMBER,
            message: 'Polling skill creation status...',
        });

        const skillId = createSkillResponse.skillId as string;
        await this.pollSkillCreation(skillId);
        return skillId;
    }

    private createManifest(skillName: string, locale: string): model.v1.skill.Manifest.SkillManifest {
        Logger.verbose(`Calling method: createManifest, args: `, skillName, locale);
        //TODO: The publishing information should change corresponding information based on the locale.
        //Refer to https://github.com/alexa/skill-sample-nodejs-hello-world/blob/master/skill.json
        const manifest: model.v1.skill.Manifest.SkillManifest = {
            publishingInformation: {
                locales: {
                    [locale]: {
                        name: skillName,
                    },
                },
            },
            apis: {
                custom: {},
            },
        };
        return manifest;
    }

    private async pollSkillCreation(skillId: string): Promise<any> {
        Logger.verbose(`Calling method: _pollSkillCreation, args: `, skillId);

        // The maximum waiting time:
        // Math.min(minTimeout * Math.pow(1.2, 30), maxTimeout) ~= 8min
        // which is the same with create self hosted skill.
        const retryOptions: retry.Options = {
            retries: 30,
            minTimeout: 2000,
            factor: 1.2,
        };
        const response: any = {
            manifest: {},
            interactionModel: {},
            provisioning: {},
        };

        await retry(async (bail: (err: Error) => void, attempt: number) => {
            Logger.verbose(`retrying skill creation polling, attempt: ${attempt}`);
            const skillStatus: any = await SmapiClientFactory.getInstance(this.profile, this.context).getSkillStatusV1(
                skillId
            );
            let buildDetails;

            response.manifest.status = view(
                lensPath([
                    SKILL_STATUS_MODEL.MANIFEST.NAME,
                    SKILL_STATUS_MODEL.MANIFEST.LAST_UPDATE_REQUEST.NAME,
                    SKILL_STATUS_MODEL.MANIFEST.LAST_UPDATE_REQUEST.STATUS,
                ]),
                skillStatus
            );
            response.manifest.errors = view(
                lensPath([
                    SKILL_STATUS_MODEL.MANIFEST.NAME,
                    SKILL_STATUS_MODEL.MANIFEST.LAST_UPDATE_REQUEST.NAME,
                    SKILL_STATUS_MODEL.MANIFEST.LAST_UPDATE_REQUEST.ERRORS.NAME,
                ]),
                skillStatus
            );

            if (skillStatus[SKILL.RESOURCES.INTERACTION_MODEL] !== undefined) {
                const locale = Object.keys(skillStatus[SKILL.RESOURCES.INTERACTION_MODEL])[0];
                response.interactionModel.status = view(
                    lensPath([SKILL.RESOURCES.INTERACTION_MODEL, locale, 'lastUpdateRequest', 'status']),
                    skillStatus
                );
                response.interactionModel.errors = view(
                    lensPath([
                        SKILL_STATUS_MODEL.INTERACTION_MODEL.NAME,
                        locale,
                        SKILL_STATUS_MODEL.INTERACTION_MODEL.LAST_UPDATE_REQUEST.NAME,
                        SKILL_STATUS_MODEL.INTERACTION_MODEL.LAST_UPDATE_REQUEST.ERRORS,
                    ]),
                    skillStatus
                );
                buildDetails = view(
                    lensPath([
                        SKILL_STATUS_MODEL.INTERACTION_MODEL.NAME,
                        locale,
                        SKILL_STATUS_MODEL.INTERACTION_MODEL.LAST_UPDATE_REQUEST.NAME,
                        SKILL_STATUS_MODEL.INTERACTION_MODEL.LAST_UPDATE_REQUEST.BUILD_DETAILS.NAME,
                    ]),
                    skillStatus
                );
            }

            response.provisioning.status = view(
                lensPath([
                    SKILL_STATUS_MODEL.HOSTED_SKILL_PROVISIONING.NAME,
                    SKILL_STATUS_MODEL.HOSTED_SKILL_PROVISIONING.LAST_UPDATE_REQUEST.NAME,
                    SKILL_STATUS_MODEL.HOSTED_SKILL_PROVISIONING.LAST_UPDATE_REQUEST.STATUS,
                ]),
                skillStatus
            );

            if (
                response.manifest.status === undefined &&
                response.provisioning.status === undefined &&
                response.interactionModel.status === undefined
            ) {
                return response;
            }

            if (
                response.manifest.status === SKILL.MANIFEST_STATUS.FAILURE ||
                response.provisioning.status === SKILL.PROVISIONING_STATUS.FAILURE ||
                (response.interactionModel.status === SKILL.INTERACTION_MODEL_STATUS.FAILURE && buildDetails) ||
                (response.provisioning.status === SKILL.PROVISIONING_STATUS.SUCCESS &&
                    response.manifest.status === SKILL.MANIFEST_STATUS.SUCCESS &&
                    response.interactionModel.status === SKILL.INTERACTION_MODEL_STATUS.SUCCESS)
            ) {
                return response;
            }
            const skillNotCreatedMsg = 'skill not yet created';
            Logger.verbose(skillNotCreatedMsg);
            throw loggableAskError(skillNotCreatedMsg);
        }, retryOptions);
    }

    async cloneSkill(skillId: string, skillName: string, progress: Progress<any>) {
        Logger.verbose(`Calling method: cloneSkill, args: `, skillId, skillName, progress);

        const smapiResource = await this.generateSmapiResource(skillId, skillName);
        const cloneHostedSkillManager = new CloneHostedSkillManager(this.context, smapiResource, this.skillFolder);
        await cloneHostedSkillManager.cloneSkill(progress, INCREMENT_NUMBER);
    }

    private async generateSmapiResource(skillId: string, skillName: string) {
        Logger.verbose(`Calling method: generateSmapiResource, args: `, skillId, skillName);

        const smapiClient = SmapiClientFactory.getInstance(this.profile, this.context);
        const skillSummary = (await smapiClient.listSkillsForVendorV1(this.vendorId, undefined, undefined, [skillId]))
            .skills?.[0];
        if (!skillSummary) {
            throw loggableAskError('No skill is found.');
        }
        const hostedSkillMetadata = await smapiClient.getAlexaHostedSkillMetadataV1(skillId);
        if (hostedSkillMetadata === undefined) {
            throw loggableAskError('No Alexa hosted skill is found.');
        }
        return new SmapiResource(new SkillInfo(skillSummary, true, hostedSkillMetadata), skillName);
    }
}
