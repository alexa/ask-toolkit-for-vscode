import { 
    SmapiResource, AbstractCommand, CommandContext, Utils, SmapiClientFactory } from '../../runtime';
import * as model from 'ask-smapi-model';

import { EN_US_LOCALE, DEFAULT_PROFILE } from '../../constants';

import skillSummary = model.v1.skill.SkillSummary;
import { Logger } from '../../logger';

export class ListSkillsCommand extends AbstractCommand<Array<SmapiResource<skillSummary>>> {
    constructor() {
        super('ask.container.listSkills');
    }

    async execute(context: CommandContext): Promise<Array<SmapiResource<skillSummary>>> {
        Logger.debug(`Calling method: ${this.commandName}`);
        const skills: Array<SmapiResource<skillSummary>> = [];
        let profile = Utils.getCachedProfile(context.extensionContext);
        profile = profile ?? DEFAULT_PROFILE;
        const vendorId = Utils.resolveVendorId(profile);

        const listSkills: model.v1.skill.ListSkillResponse = await SmapiClientFactory.getInstance(profile, context.extensionContext).listSkillsForVendorV1(
            vendorId);
        listSkills.skills?.forEach((listSkill) => {
            let skillName = 'someSkill';
            if (listSkill.nameByLocale !== undefined) {
                if (listSkill.nameByLocale[EN_US_LOCALE]) {
                    skillName = listSkill.nameByLocale[EN_US_LOCALE];
                } else {
                    skillName = Object.values(listSkill.nameByLocale)[0];
                }
            }
            skills.push(new SmapiResource<skillSummary>(listSkill, skillName));
        });
        return skills;
    }
}
