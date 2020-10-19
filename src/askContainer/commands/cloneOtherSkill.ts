import {
    SmapiResource, AbstractCommand, CommandContext
} from '../../runtime';

import { SkillInfo } from '../../models/types';
import { CloneOtherSkill } from '../../utils/cloneSkillHelper/cloneOtherSkill';
import { Logger } from '../../logger';

export class CloneOtherSkillCommand extends AbstractCommand<void> {

    constructor() {
        super('askContainer.skillsConsole.cloneOtherSkill');
    }

    async execute(context: CommandContext, skillInfo: SmapiResource<SkillInfo>): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}, args: `, skillInfo);
        const cloneOtherSkill = new CloneOtherSkill();
        await cloneOtherSkill.executeClone(context, skillInfo);
    }
}
