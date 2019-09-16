'use strict';
import * as vscode from 'vscode';
import { EXTENSION_CONFIG, OPERATION, EXTERNAL_LINKS } from '../../utils/configuration';
import open = require('open');

export const openDevPortal = vscode.commands.registerCommand(`${EXTENSION_CONFIG.DEFAULT_PREFIX}.${OPERATION.EXTERNAL.DEV_PORTAL.EXTENSION_REGISTERED_NAME}`,
    () => {
       open(EXTERNAL_LINKS.DEV_PORTAL);
    }
);