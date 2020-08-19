import * as vscode from 'vscode';
import { Logger } from './logger';

export class AskError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AskError';
    }
}

export class AskParameterAbsenceError extends AskError {
    constructor(message: string) {
        super(message);
        this.name = 'AskParameterAbsenceError';
    }
}

export function loggableAskError(message: string, error: any | undefined=undefined, exposeToUser=false): Error {
    let errMsg: string;
    if (error !== undefined) {
        let msg: string;
        if (error instanceof Error) {
            msg = error.message;
        } else {
            msg = error;
        }
        errMsg = `${message}. Reason: ${msg}`;
    } else {
        errMsg = `${message}.`;
    }
    
    Logger.error(errMsg);

    if (exposeToUser) {
        void vscode.window.showErrorMessage(errMsg);
    }

    return new AskError(errMsg);
}
