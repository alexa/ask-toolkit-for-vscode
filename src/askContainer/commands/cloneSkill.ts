import {
    SmapiResource, AbstractCommand, CommandContext
} from '../../runtime';

import { SkillInfo } from '../../models/types';
import { CloneHostedSkill} from '../../utils/cloneSkillHelper/cloneHostedSkill';
import { Logger } from '../../logger';

export class CloneSkillCommand extends AbstractCommand<void> {

    constructor() {
        super('askContainer.skillsConsole.cloneSkill');
    }

    async execute(context: CommandContext, skillInfo: SmapiResource<SkillInfo>): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}, args: `, skillInfo);
        const cloneHostedSkill = new CloneHostedSkill();
        await cloneHostedSkill.executeClone(context, skillInfo);
    }
}
