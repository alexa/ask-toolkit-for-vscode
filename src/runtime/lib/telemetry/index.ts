/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import { v4 as uuid } from 'uuid';
import { extensions, env , workspace} from 'vscode';
import { Logger } from '../../../logger';
import { EXTENSION_FULL_NAME, EXTENSION_ID } from '../../../constants';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { promiseRetry } from '../../../utils/retry';

enum MetricActionResult {
    SUCCESS = 'Success',
    FAILURE = 'Failure'
}

enum TelemetryEnabled {
    ENABLED = 'Enabled',
    DISABLED = 'Disabled',
    USE_IDE_SETTINGS = 'Use IDE settings'
}

class MetricAction {
    private result?: MetricActionResult;
    private name: string;
    private startTime: Date;
    private type: string;
    private id?: string;
    private endTime?: Date;
    private failureMessage: string;
    private ended: boolean;
    
    /**
     * @constructor
     * @param {string} name - The action name.
     * @param {string} type - The action type.
     */
    constructor(name: string, type: string) {
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

export class TelemetryClient {
    private data: {
        version: string;
        machineId: string;
        timeStarted: Date;
        newUser: boolean;
        timeUploaded: Date | null;
        clientId: string;
        actions: MetricAction[];
    };
    private postRetries: number;
    private serverUrl: string;
    private enabled: boolean;
    private httpClient: AxiosInstance;
    /**
     * @constructor
     * @param {TelemetryClientOptions} options - The options for constructor
     */
    constructor(options: TelemetryClientOptions) {
        const { } = options;
        this.httpClient = axios.create({ timeout: 3000, headers: { 'Content-Type': 'text/plain' } });
        this.serverUrl = 'https://client-telemetry.amazonalexa.com';
        this.postRetries = 3;
        this.enabled = this.isEnabled();
        this.data = {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            version: extensions.getExtension(EXTENSION_ID)?.packageJSON.version,
            machineId: env.machineId,
            timeStarted: new Date(),
            newUser: false,
            timeUploaded: null,
            clientId: EXTENSION_FULL_NAME,
            actions: []
        };
    }

    /**
     * Starts action
     * @param {string} name - The action name
     * @param {string} type - The action type
     * @return {MetricAction}
     */
    public startAction(name: string, type: string): MetricAction{
        const action = new MetricAction(name, type);
        this.data.actions.push(action);
        return action;
    }

    /**
     * Sends data to the metric server
     * @param {Error} [error] - Error object indicating an error.
     * @returns {Promise<{success: boolean}>}
     */
    public sendData(error?: Error): Promise<TelemetryUploadResult> {
        if (!this.enabled) {
            this.data.actions = [];
            Logger.debug('Telemetry is disabled. Not uploading any data.');
            return new Promise(resolve => resolve({ success: true }));
        }
        this.data.actions.forEach(action => action.end(error));
        
        return this.upload()
            .then(() => {
                this.data.actions = [];
                Logger.debug('Successfully uploaded telemetry data.');
                return { success: true } as TelemetryUploadResult;
            })
            .catch(() => {
                Logger.debug('Failed to upload telemetry data.');
                return { success: false } as TelemetryUploadResult;
            });
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