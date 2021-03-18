import { uuid } from 'uuidv4';
import * as os from 'os';
import { extensions, env , workspace, version} from 'vscode';
import * as child_process from 'child_process';
import { Logger } from '../../../logger';
import { DEFAULT_ENCODING, EXTENSION_FULL_NAME, EXTENSION_ID } from '../../../constants';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { promiseRetry } from '../../../utils/retry';
import { ext } from '../../../extensionGlobals';

enum MetricActionResult {
    SUCCESS = 'Success',
    FAILURE = 'Failure'
}

enum TelemetryEnabled {
    ENABLED = 'Enabled',
    DISABLED = 'Disabled',
    USE_IDE_SETTINGS = 'Use IDE settings'
}

export enum ActionType {
    COMMAND = 'command',
    EVENT = 'event',
    TOOLS_DOCS_VSCODE = 'TOOLS_DOCS_VSCODE',
    TOOLS_DOCS_CLI = 'TOOLS_DOCS_CLI',
    TOOLS_DOCS_ASK_SDK = 'TOOLS_DOCS_ASK_SDK',
    TOOLS_DOCS_SMAPI_SDK = 'TOOLS_DOCS_SMAPI_SDK',
    IM_EDITOR = 'IM_EDITOR'
}

class MetricAction {
    private result?: MetricActionResult;
    private name: string;
    private startTime: Date;
    private type: ActionType;
    private id?: string;
    private endTime?: Date;
    private failureMessage: string;
    private ended: boolean;
    
    /**
     * @constructor
     * @param {string} name - The action name.
     * @param {string} type - The action type.
     */
    constructor(name: string, type: ActionType) {
        this.failureMessage = '';
        this.name = name;
        this.startTime = new Date();
        this.type = type;
        this.id = uuid();
        this.ended = false;
    }

    /**
     * Closes action
     * @param {Error} [error] - Error object indicating an error.
     */
    public end(error?: Error) {
        if (this.ended) { return; }

        const hasError = error instanceof Error;
        this.result = hasError ? MetricActionResult.FAILURE : MetricActionResult.SUCCESS;
        this.failureMessage = hasError ? error?.message as string: '';
        this.endTime = new Date();
        this.ended = true;
    }

    /**
     * Implementation of custom toJSON method to modify serialization with JSON.stringify
     */
    protected toJSON() {
        return {
            end_time: this.endTime,
            failure_message: this.failureMessage,
            name: this.name,
            result: this.result,
            start_time: this.startTime,
            type: this.type,
            id: this.id
        };
    }
}

export interface TelemetryClientOptions {
}

export interface TelemetryUploadResult {
    success: boolean;
}

const TELEMETRY_UPDATE_TIME = 'telemetryUpdateTime';
const TELEMETRY_DATA = 'telemetryData';
const MINUTE = 60000;
const NUMBER_OF_INTERVALS = 15;

export class TelemetryClient {
    private data: {
        version: string;
        machineId: string;
        timeStarted: Date;
        newUser: boolean;
        timeUploaded: Date | null;
        clientId: string;
        operatingSystem: string | null;
        dependencyVersion: string | null;
        gitVersion: string | null;
        actions: MetricAction[];
    };
    private postRetries: number;
    private serverUrl: string;
    private enabled: boolean;
    private httpClient: AxiosInstance;

    private static instance: TelemetryClient;

    /**
     * @constructor
     * @param {TelemetryClientOptions} options - The options for constructor
     */
    private constructor(options?: TelemetryClientOptions) {
        if (options) {
            const { } = options;
        }
        this.httpClient = axios.create({ timeout: 3000, headers: { 'Content-Type': 'text/plain' } });
        this.serverUrl = 'https://client-telemetry.amazonalexa.com';
        this.postRetries = 3;
        this.enabled = this.isEnabled();
        const osType = os.type();
        const osArch = os.arch();
        const osRelease = os.release();
        const gitVersionUint8Array: Uint8Array = child_process.execSync(
            'git --version');
        const gitVersion = new TextDecoder(DEFAULT_ENCODING).decode(gitVersionUint8Array);
        this.data = {
            version: extensions.getExtension(EXTENSION_ID)?.packageJSON.version,
            machineId: env.machineId,
            timeStarted: new Date(),
            newUser: false,
            timeUploaded: null,
            clientId: EXTENSION_FULL_NAME,
            operatingSystem: `${osType} ${osArch} ${osRelease}`,
            dependencyVersion: version,
            gitVersion: gitVersion,
            actions: []
        };
    }

    /**
     * The static method that controls the access to the TelemetryClient instance
     * @param options 
     * @returns 
     */
    public static getInstance(options?: TelemetryClientOptions) {
        if (TelemetryClient.instance == undefined) {
            TelemetryClient.instance = new TelemetryClient(options);
        }
        return TelemetryClient.instance;
    }

    /**
     * Starts action
     * @param {string} name - The action name
     * @param {string} type - The action type
     * @return {MetricAction}
     */
    public startAction(name: string, type: ActionType): MetricAction {
        return new MetricAction(name, type);
    }

    /**
     * Store an action and send the data
     * @param action - The MetricAction item
     * @param error - The error object
     */
    public async store(action: MetricAction , error?:Error): Promise<void> {
        action.end(error);
        if (ext.context.globalState.get(TELEMETRY_UPDATE_TIME) == undefined) {
            const now = new Date().getTime();
            ext.context.globalState.update(TELEMETRY_UPDATE_TIME, now);
        }
        if (ext.context.globalState.get(TELEMETRY_DATA) == undefined) {
            ext.context.globalState.update(TELEMETRY_DATA, [action]);
            return;
        }
        const data = ext.context.globalState.get(TELEMETRY_DATA) as MetricAction[];
        data.push(action);
        ext.context.globalState.update(TELEMETRY_DATA, data);
        await this.sendData();
    }

    /**
     * Sends data to the metric server periodically
     * @returns {Promise<{success: boolean}>}
     */
    private async sendData(): Promise<TelemetryUploadResult> {
        if (!this.enabled) {
            await this.resetStoredStates();
            Logger.debug('Telemetry is disabled. Not uploading any data.');
            return new Promise(resolve => resolve({ success: true }));
        }

        if (this.shouldUpdateData() == false) {
            return new Promise(resolve => resolve({ success: true }));
        }
        this.data.actions = ext.context.globalState.get(TELEMETRY_DATA) as MetricAction[];
        
        return this.upload()
            .then(async () => {
                await this.resetStoredStates();
                Logger.debug('Successfully uploaded telemetry data.');
                return { success: true } as TelemetryUploadResult;
            })
            .catch(() => {
                Logger.debug('Failed to upload telemetry data.');
                return { success: false } as TelemetryUploadResult;
            });
    }

    /**
     * check data and timestamp for updating telemetry data
     * @returns 
     */
    private shouldUpdateData(): boolean {
        if (ext.context.globalState.get(TELEMETRY_DATA) == undefined && 
        (ext.context.globalState.get(TELEMETRY_DATA) as []).length == 0 ) {
            return false;
        }
        if (ext.context.globalState.get(TELEMETRY_UPDATE_TIME) == undefined) {
            const now = new Date().getTime();
            ext.context.globalState.update(TELEMETRY_UPDATE_TIME, now);
            return false;
        }
        const now = new Date().getTime();
        const pre = ext.context.globalState.get(TELEMETRY_UPDATE_TIME) as number;
        const diff = Math.abs(now - pre) / MINUTE;
        if (diff < NUMBER_OF_INTERVALS) {
            return false;
        }
        return true;
    }

    private async resetStoredStates(): Promise<void> {
        this.data.actions = [];
        await ext.context.globalState.update(TELEMETRY_DATA, undefined);
        await ext.context.globalState.update(TELEMETRY_UPDATE_TIME, undefined);
    }

    /**
     * Implementation of custom toJSON method to modify serialization with JSON.stringify
     */
    protected toJSON(): any {
        return {
            version: this.data.version,
            machine_id: this.data.machineId,
            time_started: this.data.timeStarted,
            new_user: this.data.newUser,
            time_uploaded: this.data.timeUploaded,
            client_id: this.data.clientId,
            operating_system: this.data.operatingSystem,
            dependency_version: this.data.dependencyVersion,
            git_version: this.data.gitVersion,
            actions: this.data.actions
        };
    }

    private isEnabled(): boolean {
        const askSetting = workspace.getConfiguration('ask').get('telemetryEnabled');
        const vsCodeSettingEnabled = workspace.getConfiguration('telemetry').get('enableTelemetry') as boolean;
        if(askSetting === TelemetryEnabled.DISABLED) { return false; }
        if(askSetting === TelemetryEnabled.ENABLED) { return true; }
        if(askSetting === TelemetryEnabled.USE_IDE_SETTINGS && vsCodeSettingEnabled) {
            return true;
        }
        return false;  
    }

    private upload(): Promise<AxiosResponse<any>> {
        this.data.timeUploaded = new Date();
        const payload = JSON.stringify({ payload: this });
        const postPromise = () => this.httpClient.post(this.serverUrl, payload);
        return promiseRetry(this.postRetries, postPromise);
    }
}