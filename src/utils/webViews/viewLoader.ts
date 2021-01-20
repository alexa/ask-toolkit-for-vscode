import { AbstractWebView } from '../../runtime';
import { ExtensionContext, Webview, Uri } from 'vscode';
import { readFileSync, existsSync } from 'fs';
import * as path from 'path';
import { DEFAULT_ENCODING } from '../../constants';
import { Logger } from '../../logger';

export class ViewLoader {
    private context: ExtensionContext;
    private subdir: string;
    private view: AbstractWebView;

    constructor(context: ExtensionContext, subdir: string, view: AbstractWebView) {
        this.context = context;
        this.subdir = subdir;
        this.view = view;
    }

    private interpolate(input: string, params: { [key: string]: any}): string {
        Logger.debug(`Calling method: interpolate, args: `, params);
        const names = Object.keys(params);
        const vals = Object.values(params);
        return new Function(...names, `return \`${input}\`;`)(...vals);
    }

    public renderView(options: RenderOptions): string {
        Logger.debug(`Calling method: renderView, args: `, options);
        const webview: Webview = this.view.getWebview() as Webview;
        
        const htmlLocation = Uri.file(path.join(this.context.extensionPath, 'media', this.subdir, `${options.name}.html`));
        if (!htmlLocation || !existsSync(htmlLocation.fsPath)) {
            return this.handleError(options.errorMsg);
        }        
        let html: string = readFileSync(htmlLocation.fsPath, DEFAULT_ENCODING);

        if (options.images) {
            for (const image of options.images) {
                const imageLocation: Uri|undefined = webview.asWebviewUri(
                    Uri.file(
                        path.join(
                            this.context.extensionPath, 'media', this.subdir, image + '.png')));
                if (!imageLocation) {
                    return this.handleError(options.errorMsg);
                }
                html = html.replace('${' + image + 'Image}', imageLocation.toString());
            }
        }

        if (options.js) {
            const jsLocation: Uri|undefined = webview.asWebviewUri(
                Uri.file(
                    path.join(
                        this.context.extensionPath, 'media', this.subdir, options.name + '.js')));
            if (!jsLocation) {
                return this.handleError(options.errorMsg);
            }
            html = html.replace('${javascript}', jsLocation.toString());
        }

        if (options.customCss) {
            html = html.replace('${toolkitCss}', options.customCss.toString());
        } else {
            const toolkitCss: Uri|undefined = webview.asWebviewUri(
                Uri.file(
                    path.join(
                        this.context.extensionPath, 'media', 'toolkit.css',
                ),
            ));
            if (!toolkitCss) {
                return this.handleError(options.errorMsg);
            }
            html = html.replace('${toolkitCss}', toolkitCss.toString());
        }
        

        if (options.args) {
            html = this.interpolate(html, options.args);
        }

        return html;
    }

    private handleError(msg?: string): string {
        msg = msg ?? 'Could not load view due to an internal error';
        Logger.error(msg);
        return msg;
    }
}

export interface RenderOptions {
    name: string;
    images?: string[];
    js?: boolean;
    customCss?: Uri;
    errorMsg?: string;
    args?: {[key: string]: any};
}