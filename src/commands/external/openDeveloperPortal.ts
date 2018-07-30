'use strict';
import * as vscode from 'vscode';
import { EXTENSION_CONFIG, OPERATION, EXTERNAL_LINKS } from '../../utils/configuration';
import opn = require('opn');

export const openDevPortal = vscode.commands.registerCommand(`${EXTENSION_CONFIG.DEFAULT_PREFIX}.${OPERATION.EXTERNAL.DEV_PORTAL.EXTENSION_REGISTERED_NAME}`,
    () => {
       opn(EXTERNAL_LINKS.DEV_PORTAL);
    }
);