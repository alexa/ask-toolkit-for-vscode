import {
    SmapiResource, AbstractCommand, CommandContext
} from '../../runtime';
 
import { SkillInfo } from '../../models/types';
import { executeClone } from '../../utils/cloneSkillHelper';
import { Logger } from '../../logger';
 
export class CloneSkillFromConsoleCommand extends AbstractCommand<void> {
    constructor() {
        super('askContainer.skillsConsole.cloneSkillFromConsole');
    }
 
    async execute(context: CommandContext, skillInfo: SmapiResource<SkillInfo>): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}, args: `, skillInfo);
        await executeClone(context, skillInfo);
    }
}