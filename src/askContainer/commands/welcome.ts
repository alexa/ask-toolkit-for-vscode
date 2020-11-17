import { AbstractCommand, CommandContext } from '../../runtime';
import { WelcomeScreenWebview } from '../webViews/welcomeScreenWebview';
import { Logger } from '../../logger';
import { registerWebviews } from '../../utils/webViews/viewManager';
import * as vscode from 'vscode';

export class WelcomeCommand extends AbstractCommand<void> {
    private welcomeScreen: WelcomeScreenWebview;

    constructor(context: vscode.ExtensionContext) {
        super('ask.welcome');
        this.welcomeScreen = new WelcomeScreenWebview(
            'Alexa Skills Kit', 'welcomeScreen', context,
        );
        registerWebviews(this.welcomeScreen);
    }

    async execute(context: CommandContext): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}`);
        this.welcomeScreen.showView();
    }
}