/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import * as vscode from "vscode";
import * as sinon from "sinon";

import { TelemetryClient } from "../src/runtime/lib/telemetry";

const SECOND = 1000;
export const TIMEOUT = 30 * SECOND;


export class FakeExtensionContext implements vscode.ExtensionContext {
    public subscriptions: Array<{ dispose(): any }> = [];
    public workspaceState: vscode.Memento = new FakeMemento();
    public globalState: vscode.Memento & {setKeysForSync(keys: string[]): void;} = new FakeGlobalStorage();
    public storagePath: string | undefined;
    public globalStoragePath = '.';
    public logPath = '';
    public extensionMode;
    public extensionUri;
    public environmentVariableCollection;

    // Flowing properties is required after @types/vscode v1.49.0
    public storageUri;
    public globalStorageUri;
    public logUri;

    private _extensionPath = '';

    public constructor(preload?: FakeExtensionState) {
        if (preload !== undefined) {
            this.globalState = new FakeGlobalStorage(preload.globalState);
            this.workspaceState = new FakeMemento(preload.workspaceState);
        }
    }

    public get extensionPath(): string {
        return this._extensionPath;
    }

    public set extensionPath(path: string) {
        this._extensionPath = path;
    }

    public asAbsolutePath(relativePath: string): string {
        return relativePath;
    }


    /**
     * Creates a fake `ExtContext` for use in tests.
     */
    public static  getFakeExtContext(): FakeExtensionContext {
        const ctx = new FakeExtensionContext();

        return ctx;
    }
}

class FakeMemento implements vscode.Memento {
    public constructor(private readonly _storage: FakeMementoStorage = {}) {}
    public get<T>(key: string): T | undefined;
    public get<T>(key: string, defaultValue: T): T;
    public get(key: any, defaultValue?: any) {
        if (this._storage.hasOwnProperty(String(key))) {
            return this._storage[key];
        }
        if (defaultValue) {
            return defaultValue;
        }

        return undefined;
    }
    public update(key: string, value: any): Thenable<void> {
        this._storage[key] = value;

        return Promise.resolve();
    }
}

class FakeGlobalStorage extends FakeMemento {
    public setKeysForSync(keys: string[]): void {
        return;
    }
}

export interface FakeExtensionState {
    globalState?: FakeMementoStorage;
    workspaceState?: FakeMementoStorage;
}

export interface FakeMementoStorage {
    [key: string]: any;
}

export class FakeWebviewPanelOnDidChangeViewStateEvent implements vscode.WebviewPanelOnDidChangeViewStateEvent {
    public webviewPanel: FakeWebviewPanel = FakeWebviewPanel.getFakeWebViewPanel();
    
    public static getFakeWebviewPanelOnDidChangeViewStateEvent(): FakeWebviewPanelOnDidChangeViewStateEvent {
        const fakeEvent = new FakeWebviewPanelOnDidChangeViewStateEvent();

        return fakeEvent;
    }
}

export class FakeWebviewPanel implements vscode.WebviewPanel {
    public viewType = '';
    public title = '';
    public iconPath?: vscode.Uri | { light: vscode.Uri; dark: vscode.Uri };
    public webview = FakeWebView.getFakeWebView();
    public options: vscode.WebviewPanelOptions = {};
    public viewColumn?: vscode.ViewColumn;
    public active;
    public visible;
    public onDidChangeViewState;
    onDidDispose: any;
    reveal(viewColumn?: vscode.ViewColumn, preserveFocus?: boolean): void {}
    dispose(): any {}

    public static getFakeWebViewPanel(): FakeWebviewPanel {
        const fakeWebViewPanel = new FakeWebviewPanel();

        return fakeWebViewPanel;
    }
    
}

export class FakeWebView implements vscode.Webview {
    public options;
    public html = '';
    public onDidReceiveMessage;
    public postMessage;
    public asWebviewUri;
    public cspSource = '';

    public static getFakeWebView(): FakeWebView {
        const fakeWebView = new FakeWebView();
        return fakeWebView;
    }
}

export function stubTelemetryClient(sandBox: sinon.SinonSandbox) {
    sandBox.stub(TelemetryClient.prototype, "sendData");
    sandBox.stub(TelemetryClient.prototype, 'startAction');
}