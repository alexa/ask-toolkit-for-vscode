'use strict';
import * as vscode from 'vscode';
import { EXTENSION_CONFIG, OPERATION, EXTERNAL_LINKS } from '../../utils/configuration';
import open = require('open');

export const openHelpDoc = vscode.commands.registerCommand(`${EXTENSION_CONFIG.DEFAULT_PREFIX}.${OPERATION.EXTERNAL.HELP_DOC.EXTENSION_REGISTERED_NAME}`,
    () => {
       open(EXTERNAL_LINKS.HELP_DOC);
    }
);