import { AbstractCommand, CommandContext } from '../../runtime';
import { InitialLoginWebview } from '../webViews/initialLogin';
import * as vscode from 'vscode';
import { registerWebviews } from '../../utils/webViews/viewManager';
import { Logger } from '../../logger';

export class LoginCommand extends AbstractCommand<void> {
    private loginView: InitialLoginWebview;

    constructor(loginView: InitialLoginWebview) {
        super('ask.login');
        this.loginView = loginView;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async execute(context: CommandContext, dispose?: boolean): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}`);
        if (dispose === true) {
            this.loginView.dispose();
        } else {
            this.loginView.showView();
        }
    }
}