'use strict';

import * as vscode from 'vscode';
import * as shell from 'shelljs';
import { ERROR_AND_WARNING, EXTERNAL_LINKS } from './configuration';
import opn = require('opn');

export async function wasAskCliInstalled() {
    if (!shell.which('ask')) {
        const action = await vscode.window.showErrorMessage(ERROR_AND_WARNING.MISSING_ASK_CLI, ERROR_AND_WARNING.SUGGEST_INSTALL_CLI);
        if (action === ERROR_AND_WARNING.SUGGEST_INSTALL_CLI) {
            opn(EXTERNAL_LINKS.ASK_CLI_INSTALL_DOC);
        }
        return false;
    }
    return true;
}