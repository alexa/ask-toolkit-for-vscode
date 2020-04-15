'use strict';

import * as vscode from 'vscode';
import * as shell from 'shelljs';
import { ERROR_AND_WARNING } from './configuration';

export async function wasAskCliInstalled() {
    if (!shell.which('ask')) {
        vscode.window.showErrorMessage(ERROR_AND_WARNING.MISSING_ASK_CLI);
        return false;
    }
    return true;
}