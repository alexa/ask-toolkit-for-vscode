import { AbstractCommand, CommandContext } from '../../runtime';
import { CreateSkillWebview } from '../webViews/createSkillWebview/createSkillWebview';
import { Logger } from '../../logger';

export class CreateSkillCommand extends AbstractCommand<void> {
    private createSkillWebview: CreateSkillWebview;

    constructor(createSkillWebview: CreateSkillWebview) {
        super('ask.new');
        this.createSkillWebview = createSkillWebview;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async execute(context: CommandContext): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}`);
        this.createSkillWebview.showView();
    }
}