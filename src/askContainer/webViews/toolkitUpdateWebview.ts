import { AbstractWebView } from '../../runtime';
import { ExtensionContext, WebviewPanelOnDidChangeViewStateEvent } from 'vscode';
import { ViewLoader } from '../../utils/webViews/viewLoader';
import { Logger } from '../../logger';
import { WEB_VIEW_NAME } from '../../constants';

export class ToolkitUpdateWebview extends AbstractWebView {
    private loader: ViewLoader;

    constructor(viewTitle: string, viewId: string, context: ExtensionContext) {
        super(viewTitle, viewId, context);
        this.isGlobal = true;
        this.loader = new ViewLoader(this.extensionContext, WEB_VIEW_NAME.TOOLKIT_UPDATE, this);
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
            name: WEB_VIEW_NAME.TOOLKIT_UPDATE,
            js: false
        });
    }

}
