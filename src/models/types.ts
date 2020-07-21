import { SmapiClientFactory } from '../runtime';
import * as model from 'ask-smapi-model';
import skillSummary = model.v1.skill.SkillSummary;
import hostedSkillMetadata = model.v1.skill.AlexaHosted.HostedSkillMetadata;


export class SkillInfo {
    skillSummary: skillSummary;
    isHosted: boolean | undefined;
    hostedSkillMetadata: hostedSkillMetadata | undefined;

    constructor(
        skillSummary: skillSummary, 
        isHosted: boolean | undefined=undefined, 
        hostedSkillMetadata: hostedSkillMetadata | undefined=undefined) {
        this.skillSummary = skillSummary;
        this.hostedSkillMetadata = hostedSkillMetadata;
        this.isHosted = isHosted;
    }
}