// This module will contain the abstract components for different VSCode contents to implement

import * as path from 'path';

import { TelemetryClient } from './telemetry';
import { Disposable, ExtensionContext, commands, TreeItem, TreeItemCollapsibleState,
    Uri, ThemeIcon, Command, WebviewPanel, Webview, window, ViewColumn,
    WebviewOptions, WebviewPanelOptions, WebviewPanelOnDidChangeViewStateEvent, TreeView, TreeDataProvider } from "vscode";
import { Resource } from '../../runtime';

export interface CommandContext {
    // A common context that can be passed to all commands
    // Can have some global information shared here
    command: string;
    extensionContext: ExtensionContext;
}

export interface GenericCommand extends Disposable {
    context: ExtensionContext;
    execute(context: CommandContext, ...args: any[]): Promise<any>;
}

export function registerCommands(context: ExtensionContext, commands: GenericCommand[]): void {
    commands.forEach(command => {
        command.context = context;
        context.subscriptions.push(command);    
    });
}

export abstract class AbstractCommand<T> implements GenericCommand, Command {
    // Need this for adding AbstractCommand as a valid type
    title: string;
    command: string;
    tooltip?: string;
    arguments?: any[];

    private _disposableCommand: Disposable;
    context!: ExtensionContext;
    abstract execute(context: CommandContext, ...args: any[]): Promise<T>; 

    constructor(public commandName: string){
        this.title = this.command = commandName;

        this._disposableCommand = commands.registerCommand(
            commandName, (...args: any[]) => { 
                return this._invoke(commandName, ...args);
            },
            this
        );
    }

    dispose(): void {
        this._disposableCommand.dispose();
    }

    private async _invoke(commandName: string, ...args: any[]): Promise<T> {
        const typeArg = args.find(arg => arg.CommandType);
        const commandType = typeArg !== undefined ? typeArg.CommandType : 'command';
        const telemetryClient = new TelemetryClient({});
        let output: any;

        // Create toolkit context to pass on
        const context: CommandContext = { 
            command: commandName, 
            extensionContext: this.context
        };
        try {
            telemetryClient.startAction(commandName, commandType);
            output = await this.execute(context, ...args);
            await telemetryClient.sendData();
            return output as Promise<T>;
        } catch (err) {
            await telemetryClient.sendData(err);
            throw err;
        }
    }
}

export enum ContextValueTypes {
    // An enum type to provide context values across other components
    SKILL_RESOURCE = 'skillResource',
    SKILL = 'skill',
    MANIFEST = 'manifest',
    INTERACTION_MODEL = 'interactionModel',
    CODE = 'code',
    SKILL_PACKAGE = 'skillPackage'
}

export class PluginTreeItem<Resource> extends TreeItem {
    public readonly data: Resource | null;

    constructor(
        label: string, itemData: Resource | null, collapsibleState: TreeItemCollapsibleState, 
        command?: Command, 
        iconPath?: string | Uri | { light: string | Uri; dark: string | Uri } | ThemeIcon,
        contextVal?: ContextValueTypes | string) {
        super(label, collapsibleState);
        this.command = command;
        this.iconPath = iconPath;
        this.data = itemData;
        this.contextValue = contextVal;
    }
}

export abstract class AbstractWebView {
    private _panel!: WebviewPanel;
    private _isPanelDisposed!: boolean;
    protected readonly extensionContext: ExtensionContext;
    viewTitle: string;
    viewId: string;
    options: WebviewPanelOptions & WebviewOptions;
    showOptions: { viewColumn: ViewColumn, preserveFocus?: boolean };
    protected isGlobal = false;

    constructor(viewTitle: string, viewId: string, 
        context: ExtensionContext,
        viewColumn?: ViewColumn,
        localResourcesUri?: Uri,
        showOptions?: { viewColumn: ViewColumn, preserveFocus?: boolean }, 
        options?: WebviewPanelOptions & WebviewOptions
        ) {
            if (viewColumn === undefined && window.activeTextEditor) {
                viewColumn = window.activeTextEditor.viewColumn;
            }

            if (showOptions  === undefined) {
                showOptions =  {
                    viewColumn: viewColumn ?? ViewColumn.One,
                    preserveFocus: false
                };
            }

            if (localResourcesUri === undefined) {
                localResourcesUri = Uri.file(path.join(context.extensionPath, 'media'));
            }

            if (options === undefined) {
                options = {
                    enableScripts: true,
                    localResourceRoots: [localResourcesUri]
                };
            }

            this.viewId = viewId;
            this.viewTitle = viewTitle;
            this.options = options;
            this.showOptions = showOptions;

            this.extensionContext = context;
        }

    public getWebview(): Webview {
        return this.getPanel().webview;
    }

    public showView(...args: any[]): void {
        if (this._panel === undefined || this._isPanelDisposed) {
            this._panel = window.createWebviewPanel(
                this.viewId, this.viewTitle, this.showOptions, this.options
            );
            this._panel.onDidDispose(
                () => {
                    this._isPanelDisposed = true;
                },
                undefined,
                this.extensionContext.subscriptions
            );
            this._panel.iconPath = {
                dark: Uri.parse('https://d34a6e1u0y0eo2.cloudfront.net/media/images/alexa.png'),
                light: Uri.parse('https://d34a6e1u0y0eo2.cloudfront.net/media/images/alexa.png')
            };
            this.getWebview().html = this.getHtmlForView(...args);
            this._isPanelDisposed = false;
            this.setEventListeners();
        } else {
            this.reviveView(...args);
        }
    }

    public getPanel(): WebviewPanel {
        return this._panel;
    }

    public dispose(): void {
        this._panel.dispose();
    }

    public getIsGlobal(): boolean {
        return this.isGlobal;
    }

    public isDisposed(): boolean {
        return this._isPanelDisposed;
    }

    abstract onViewChangeListener(
        event: WebviewPanelOnDidChangeViewStateEvent): void;

    abstract onReceiveMessageListener(message: any): void;

    abstract getHtmlForView(...args: any[]): string;

    public reviveView(...args: any[]): void {
        this.getWebview().html = this.getHtmlForView(...args);
        this.getPanel().reveal();
    }

    private setEventListeners(): void {
        this._panel.onDidChangeViewState(
            event => {
                this.onViewChangeListener(event);
            },
            null,
            []
        );

        this._panel.webview.onDidReceiveMessage(
            message => {
                this.onReceiveMessageListener(message);
            },
            null,
            []
        );

        this._panel.onDidDispose(
            () => {
                this.dispose();
            },
            null,
            []
        );
    }
}

export abstract class AbstractTreeView {
    protected abstract view: TreeView<PluginTreeItem<Resource>>;
    public extensionContext: ExtensionContext;

    constructor(context: ExtensionContext) {
        this.extensionContext = context;
    }
}