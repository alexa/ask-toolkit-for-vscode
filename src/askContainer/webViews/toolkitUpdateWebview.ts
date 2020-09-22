import { AbstractWebView } from '../../runtime';
import { ExtensionContext, WebviewPanelOnDidChangeViewStateEvent } from 'vscode';
import { ViewLoader } from '../../utils/webViews/viewLoader';
import { Logger } from '../../logger';

export class ToolkitUpdateWebview extends AbstractWebView {
    private loader: ViewLoader;

    constructor(viewTitle: string, viewId: string, context: ExtensionContext) {
        super(viewTitle, viewId, context);
        this.isGlobal = true;
        this.loader = new ViewLoader(this.extensionContext, 'toolkitUpdate', this);
    }

    onViewChangeListener(event: WebviewPanelOnDidChangeViewStateEvent): void {
        Logger.debug(`Calling method: ${this.viewId}.onViewChangeListener`);
        return;
    }

    onReceiveMessageListener(message: any): void {
        Logger.debug(`Calling method: ${this.viewId}.onReceiveMessageListener, args: `, message);
        return;
    }

    getHtmlForView(...args: unknown[]): string {
        Logger.debug(`Calling method: ${this.viewId}.getHtmlForView`);
        return this.loader.renderView({
            name: 'toolkitUpdate',
            js: false
        });
    }

}
