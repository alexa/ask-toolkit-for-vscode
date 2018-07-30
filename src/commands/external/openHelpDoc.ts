'use strict';
import * as vscode from 'vscode';
import { EXTENSION_CONFIG, OPERATION, EXTERNAL_LINKS } from '../../utils/configuration';
import opn = require('opn');

export const openHelpDoc = vscode.commands.registerCommand(`${EXTENSION_CONFIG.DEFAULT_PREFIX}.${OPERATION.EXTERNAL.HELP_DOC.EXTENSION_REGISTERED_NAME}`,
    () => {
       opn(EXTERNAL_LINKS.HELP_DOC);
    }
);