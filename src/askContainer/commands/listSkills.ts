/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import { 
    SmapiResource, AbstractCommand, CommandContext, Utils, SmapiClientFactory } from '../../runtime';
import * as model from 'ask-smapi-model';

import { EN_US_LOCALE, DEFAULT_PROFILE } from '../../constants';

import skillSummary = model.v1.skill.SkillSummary;
import skillManagementServiceClient = model.services.skillManagement.SkillManagementServiceClient;
import { Logger } from '../../logger';
import { loggableAskError } from '../../exceptions';

export class ListSkillsCommand extends AbstractCommand<Array<SmapiResource<skillSummary>>> {
    constructor() {
        super('ask.container.listSkills');
    }

    private async getSkillsList(
        smapiClientInstance: skillManagementServiceClient, vendorId: string, nextToken: undefined | string, 
        skillsList: Array<SmapiResource<skillSummary>>): Promise<Array<SmapiResource<skillSummary>>> {
        const listSkills: model.v1.skill.ListSkillResponse = await smapiClientInstance.listSkillsForVendorV1(
            vendorId, nextToken);
        listSkills.skills?.forEach((listSkill) => {
            let skillName = 'someSkill';
            if (listSkill.nameByLocale !== undefined && Object.values(listSkill.nameByLocale).length > 0) {
                if (listSkill.nameByLocale[EN_US_LOCALE]) {
                    skillName = listSkill.nameByLocale[EN_US_LOCALE];
                } else {
                    skillName = Object.values(listSkill.nameByLocale)[0];
                }
            }
            skillsList.push(new SmapiResource<skillSummary>(listSkill, skillName));
        });

        if (listSkills.isTruncated ?? true) {
            await this.getSkillsList(smapiClientInstance, vendorId, listSkills.nextToken, skillsList);
        }


        return skillsList;
    }

    async execute(context: CommandContext): Promise<Array<SmapiResource<skillSummary>>> {
        Logger.debug(`Calling method: ${this.commandName}`);
        const skills: Array<SmapiResource<skillSummary>> = [];
        let profile = Utils.getCachedProfile(context.extensionContext);
        profile = profile ?? DEFAULT_PROFILE;
        let vendorId: string;
        try {
            vendorId = Utils.resolveVendorId(profile);
        } catch (err) {
            throw loggableAskError(`Failed to retrieve vendorID for profile ${profile}`, err, true);
        }

        await this.getSkillsList(
            SmapiClientFactory.getInstance(profile, context.extensionContext), vendorId, undefined, skills);
        return skills;
    }
}
