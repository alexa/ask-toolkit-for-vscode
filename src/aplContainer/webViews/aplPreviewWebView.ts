import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as R from "ramda";
import * as jsonfile from "jsonfile";
import { IViewport } from "apl-suggester";
import { AbstractWebView } from '../../runtime';
import { ViewLoader } from "../../utils/webViews/viewLoader";
import {
    APL_DOCUMENT_FILE_PATH,
    DATASOURCES_FILE_PATH,
    DATA_PATH_REGEX,
    DOCUMENT_PATH_REGEX,
} from "../config/configuration";
import { DEFAULT_VIEWPORT_CHARACTERISTICS } from "../utils/viewportProfileHelper";
import { Logger } from "../../logger";

export class AplPreviewWebView extends AbstractWebView {
    private loader: ViewLoader;
    private viewport: IViewport;
    private context: vscode.ExtensionContext;
    private document: string | undefined;
    private datasources: string | undefined;
    private disposables: vscode.Disposable[];

    constructor(
        viewTitle: string,
        viewId: string,
        context: vscode.ExtensionContext
    ) {
        const allowedLocalResourceUri: vscode.Uri = vscode.Uri.file(context.extensionPath);
        super(viewTitle, viewId, context, vscode.ViewColumn.Beside, allowedLocalResourceUri, { preserveFocus: true, viewColumn: vscode.ViewColumn.Beside });
        this.loader = new ViewLoader(this.extensionContext, "previewApl", this);
        this.viewport = DEFAULT_VIEWPORT_CHARACTERISTICS;
        this.disposables = [];
        this.context = context;
    }

    /**
     * Function to post a message to APL Preivew web view to update viewport
     * Used by ChangeViewportCommand 
     * @param {IViewport} viewport viewport to update
     * 
     * @memberOf AplPreviewWebView
     */
    public changeViewport(viewport: IViewport) {
        Logger.verbose(`Calling method: ${this.viewId}.changeViewport, args: `, viewport.toString());
        if (!R.equals(this.viewport, viewport)) {
            this.viewport = viewport;
            this.postMessage();
        }
    }

    dispose(): void {
        Logger.debug(`Calling method: ${this.viewId}.dispose`);
        // dispose web view panel
        this.getPanel().dispose();

        // clean up listeners
        while (this.disposables.length) {
            const d: vscode.Disposable | undefined = this.disposables.pop();
            if (d) {
                d.dispose();
            }
        }
    }

    update(document: vscode.TextDocument): void {
        Logger.verbose(`Calling method: ${this.viewId}.update APL from active text editor`);
        const textDocumentPath: string = R.path(["uri", "fsPath"], document) as string;
        if (!textDocumentPath) {
            return;
        }
        if (DOCUMENT_PATH_REGEX.test(textDocumentPath)) {
            const document: string = this.getJson(textDocumentPath);
            const datasourcesPath: string = path.join(
                path.dirname(textDocumentPath),
                DATASOURCES_FILE_PATH
            );
            const datasources: string = fs.existsSync(datasourcesPath)
                ? this.getJson(datasourcesPath)
                : "{}";
            this.document = document;
            this.datasources = datasources;
        } else if (DATA_PATH_REGEX.test(textDocumentPath)) {
            const documentPath: string = path.join(
                path.dirname(path.dirname(textDocumentPath)),
                APL_DOCUMENT_FILE_PATH
            );
            if (fs.existsSync(documentPath)) {
                const document: string = this.getJson(documentPath);
                const datasources: string = this.getJson(textDocumentPath);
                this.document = document;
                this.datasources = datasources;
            }
        } else {
            this.dispose();
        }
    }

    getJson(fsPath: string): string {
        try {
            return JSON.stringify(jsonfile.readFileSync(fsPath));
        } catch (error) {
            return "{}";
        }
    }

    postMessage() {
        Logger.verbose(`Calling method: ${this.viewId}.postMessage`);
        this.getWebview()?.postMessage({
            document: this.document,
            datasources: this.datasources,
            viewport: JSON.stringify(this.viewport),
        });
    }

    getHtmlForView(...args: any[]): string {
        Logger.debug(`Calling method: ${this.viewId}.getHtmlForView`);
        // Listen for when text document is saved
        vscode.workspace.onDidSaveTextDocument(
            (document) => {
                if (this.getPanel().visible) {
                    this.update(document);
                    this.postMessage();
                }
            },
            null,
            this.disposables
        );

        // Listen for when active editor is changed
        vscode.window.onDidChangeActiveTextEditor(
            (editor) => {
                const shouldUpdate = this.getPanel().visible && !this.getPanel().active;
                if (shouldUpdate && editor && editor.document) {
                    this.update(editor.document);
                    this.postMessage();
                }
            },
            null,
            this.disposables
        );

        // Get the active text editor
        const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
        if (!editor || !editor.document) {
            return "";
        }
        this.update(editor.document);

        const webview: vscode.Webview = this.getWebview() as vscode.Webview;
        const aplRenderPath: vscode.Uri = webview.asWebviewUri(
            vscode.Uri.file(
                path.join(
                    this.extensionContext.extensionPath, 'media/previewApl', 'aplRenderUtils.js',
                ),
            ));

        const customJavascript = this.getWebview()?.asWebviewUri(
            vscode.Uri.file(
                path.join(
                    this.context.extensionPath, "/node_modules/apl-viewhost-web/index.js"))).toString();

        return this.loader.renderView({
            name: "previewApl",
            js: true,
            args: {
                "aplRenderUtils": aplRenderPath,
                customJavascript: customJavascript
            }
        });
    }

    reviveView(): void {
        Logger.debug(`Calling method: ${this.viewId}.reviveView`);
        const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
        if (!editor || !editor.document) {
            return;
        }
        this.update(editor.document);
        this.postMessage();
    }

    onViewChangeListener(event: vscode.WebviewPanelOnDidChangeViewStateEvent): void {
        throw new Error("Method not implemented.");
    }

    onReceiveMessageListener(message: any): void {
        this.postMessage();
    }
}