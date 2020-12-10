import * as vscode from 'vscode';
import { AbstractWebView } from '../../runtime';
import { GIT_MESSAGES, EXTENSION_STATE_KEY, WEB_VIEW_NAME, DYNAMIC_CONTENT } from '../../constants';
import { isGitInstalled } from '../../utils/gitHelper';
import { ViewLoader } from '../../utils/webViews/viewLoader';
import { Logger } from '../../logger';
import axios from 'axios';

type welcomeScreenViewType = {
    target?: string;
    showWelcome?: boolean;
    loaded?: boolean;
};

export class WelcomeScreenWebview extends AbstractWebView {
    private loader: ViewLoader;

    constructor(viewTitle: string, viewId: string, context: vscode.ExtensionContext) {
        super(viewTitle, viewId, context);
        this.isGlobal = true;
        this.loader = new ViewLoader(this.extensionContext, WEB_VIEW_NAME.WELCOME_SCREEN, this);
    }

    onViewChangeListener(event: vscode.WebviewPanelOnDidChangeViewStateEvent): void {
        Logger.debug(`Calling method: ${this.viewId}.onViewChangeListener`);

        const enabled = vscode.workspace.getConfiguration(
            EXTENSION_STATE_KEY.CONFIG_SECTION_NAME).get(
                EXTENSION_STATE_KEY.SHOW_WELCOME_SCREEN);
        this.getWebview()?.postMessage(
            {
                enabled: enabled ? true : false
            }
        );
        this.getBlogUpdates();
        this.getFeatureUpdates();
        return;
    }

    onReceiveMessageListener(message: welcomeScreenViewType): void {
        Logger.debug(`Calling method: ${this.viewId}.onReceiveMessageListener, args: `, message);
        if (message.target === 'createSkill') {
            vscode.commands.executeCommand('ask.new');
        } else if (message.target === 'importSkill') {
            vscode.commands.executeCommand('ask.container.viewAllSkills');
        } else if (message.target === 'profileManager') {
            vscode.commands.executeCommand('ask.init');
        } else if (message.showWelcome !== undefined) {
            vscode.workspace.getConfiguration().update(
                `${EXTENSION_STATE_KEY.CONFIG_SECTION_NAME}.${EXTENSION_STATE_KEY.SHOW_WELCOME_SCREEN}`, 
                message.showWelcome, vscode.ConfigurationTarget.Global);
        }
    }

    getHtmlForView(...args: unknown[]): string {
        Logger.debug(`Calling method: ${this.viewId}.getHtmlForView`);
        const enabled = vscode.workspace.getConfiguration(
            EXTENSION_STATE_KEY.CONFIG_SECTION_NAME).get(
                EXTENSION_STATE_KEY.SHOW_WELCOME_SCREEN);
        this.checkGitInstallation();
        return this.loader.renderView({
            name: WEB_VIEW_NAME.WELCOME_SCREEN,
            js: false,
            args: {
                enabled: enabled ? 'checked' : ''
            }
        });
    }

    private checkGitInstallation() {
        Logger.verbose(`Calling method: checkGitInstallation`);
        if (!isGitInstalled()) {
            vscode.window.showWarningMessage(GIT_MESSAGES.GIT_NOT_FOUND);
        }
    }
     
    private async getBlogUpdates(): Promise<void> {
        try {
            const res = await axios.get(DYNAMIC_CONTENT.BLOG_POSTS_JSON);
            void this.getPanel().webview.postMessage({ blogUpdates: res.data.listComponent.slice(0, 3) });
        } catch (err) {
            void this.getPanel().webview.postMessage({ blogUpdates: {error: err} });
        }
    }
 
    private async getFeatureUpdates(): Promise<void> {
        try {
            const res = await axios.get(DYNAMIC_CONTENT.ASK_UPDATES_JSON);
            void this.getPanel().webview.postMessage({ featureUpdates: res.data.updates.slice(0, 3) });
        } catch (err) {
            void this.getPanel().webview.postMessage({ featureUpdates: {error: err} });
        }
    }
}
