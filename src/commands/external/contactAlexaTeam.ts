'use strict';
import * as vscode from 'vscode';
import { EXTENSION_CONFIG, OPERATION, EXTERNAL_LINKS } from '../../utils/configuration';
import opn = require('opn');

const optionUrlMap = new Map<string, string>();
const CONTACT_ALEXA_DEVELOPER_SUPPORT = 'Contact Alexa Developer Support';
const DEVELOPER_FORUMS = 'Go to the Amazon Developer Forums';
const FEATURE_REQUEST = 'Submit a new feature request';

optionUrlMap.set(CONTACT_ALEXA_DEVELOPER_SUPPORT, EXTERNAL_LINKS.CONTACT_US);
optionUrlMap.set(DEVELOPER_FORUMS, EXTERNAL_LINKS.DEVELOPER_FORUMS);
optionUrlMap.set(FEATURE_REQUEST, EXTERNAL_LINKS.FEATURE_REQUEST);

export const contactAlexaTeam = vscode.commands.registerCommand(`${EXTENSION_CONFIG.DEFAULT_PREFIX}.${OPERATION.EXTERNAL.CONTACT_ALEXA_TEAM.EXTENSION_REGISTERED_NAME}`,
    async () => {
        const pickedContactMethod = await vscode.window.showQuickPick([
            CONTACT_ALEXA_DEVELOPER_SUPPORT,
            DEVELOPER_FORUMS,
            FEATURE_REQUEST
        ]);
        if (pickedContactMethod) {
            opn(<string>optionUrlMap.get(pickedContactMethod));
        }
    }
);

