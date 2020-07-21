import { 
    AbstractCommand, CommandContext } from '../../runtime';
import { Logger } from '../../logger';
import { onWorkspaceOpenEventEmitter } from '../events';

export class RefreshSkillActionsCommand extends AbstractCommand<void> {
    constructor() {
        super('askContainer.skill-actions.refresh');
    }

    async execute(context: CommandContext): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}`);
        onWorkspaceOpenEventEmitter.fire(undefined);
    }
}
