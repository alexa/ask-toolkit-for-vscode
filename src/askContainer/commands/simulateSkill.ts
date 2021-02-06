import { SimulateSkillWebview } from '../webViews/simulateSkillWebview';
import { Logger } from '../../logger';
import { loggableAskError } from '../../exceptions';
import { AbstractCommand, CommandContext } from '../../runtime';

export class SimulateSkillCommand extends AbstractCommand<void> {
    private simulateSkillWebview: SimulateSkillWebview;

    constructor(webview: SimulateSkillWebview) {
        super('askContainer.skillsConsole.simulateSkill');
        this.simulateSkillWebview = webview;
    }

    async execute(context: CommandContext): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}`);
        try {
            this.simulateSkillWebview.showView();
        } catch (err) {
            throw loggableAskError(`Cannot open test skill view`, err, true);
        }
    }
}