
import { AbstractCommand, CommandContext } from '../../runtime';
import { InitialLoginWebview } from '../webViews/initialLogin';
import * as vscode from 'vscode';
import { registerWebviews } from '../../utils/webViews/viewManager';
import { Logger } from '../../logger';

export class LoginCommand extends AbstractCommand<void> {
    private loginView: InitialLoginWebview;

    constructor(context: vscode.ExtensionContext) {
        super('ask.login');
        this.loginView = new InitialLoginWebview('Sign in', 'initialLogin', context);
        registerWebviews(this.loginView);
    }

    async execute(context: CommandContext, dispose?: boolean): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}`);
        if (dispose) {
            this.loginView.dispose();
        } else {
            this.loginView.showView();
        }
    }
}