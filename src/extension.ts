'use strict';

import * as vscode from 'vscode';
import { CommandRunner } from "./utils/commandRunner";
import { deploy } from './commands/highLevelCommands/deploy';
import { deployIspOnly } from './commands/highLevelCommands/deployIspOnly';
import { deployLambdaOnly } from './commands/highLevelCommands/deployLambdaOnly';
import { deployModelsOnly } from './commands/highLevelCommands/deployModelsOnly';
import { deploySkillManifestOnly } from './commands/highLevelCommands/deploySkillManifestOnly';
import { simulate } from './commands/highLevelCommands/simulate';
import { clone } from './commands/highLevelCommands/clone';
import { newWithTemplate } from './commands/highLevelCommands/new';
import { init } from './commands/highLevelCommands/init';
import { openDevPortal } from './commands/external/openDeveloperPortal';
import { openHelpDoc } from './commands/external/openHelpDoc';
import { EXTENSION_CONFIG, OPERATION, ERROR_AND_WARNING } from './utils/configuration';
import { createStatusBarItem } from './utils/statusBarHelper';
import { askLowLevelCommands } from './commands/lowLevelCommandsRegister.';
import { deleteSkill } from './commands/lowLevelCommands/delete-skill';
import { lambdaLog } from './commands/lowLevelCommands/lambda-log';
import { ProfileManager } from './utils/profileManager';
import { wasAskCliInstalled } from './utils/askCliHelper';
import { diff } from './commands/highLevelCommands/diff';
import { contactAlexaTeam } from './commands/external/contactAlexaTeam';
import { doesWorkSpaceExist, askUserToPickAWorkspace } from './utils/highLevelCommandHelper';
import { dialog } from './commands/highLevelCommands/dialog';
import { configure } from './commands/highLevelCommands/configure';

export async function activate(context: vscode.ExtensionContext) {
    if (!await wasAskCliInstalled()) {
        return;
    }

    registerCommands(context);
    addStatusBarItems(context);

    try{
        ProfileManager.init();
    } catch (error) {
        throw error;
    }
    
    // Register the handler for deleting cached terminal when it's closed.
    context.subscriptions.push(vscode.window.onDidCloseTerminal((terminal)=> {
        CommandRunner.onDidCloseTerminal(terminal);
    }));
}

// this method is called when your extension is deactivated
export function deactivate() {
}

function registerCommands(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        deploy,
        deployIspOnly,
        deployLambdaOnly,
        deployModelsOnly,
        deploySkillManifestOnly,
        clone,
        simulate,
        newWithTemplate,
        init,
        diff,
        dialog,
        configure
    );
    context.subscriptions.push(
        openDevPortal,
        openHelpDoc,
        contactAlexaTeam
    );

    context.subscriptions.push(askLowLevelCommands);
    context.subscriptions.push(vscode.commands.registerCommand(EXTENSION_CONFIG.DEFAULT_PREFIX + '.deleteSkill', async () => {
        if (!await wasAskCliInstalled()) {
            return;
        }
        if (!doesWorkSpaceExist()) {
            await askUserToPickAWorkspace(ERROR_AND_WARNING.CHECK_WORKSPACE_EXISTS.DEPLOY_AND_RELATED_ERROR_MESSAGE);
            return;
        }
        if (!await ProfileManager.getProfileList()) {
            ProfileManager.showProfileMissingAndSetupNotice();
            return;
        }
        await deleteSkill();
    }));
    context.subscriptions.push(vscode.commands.registerCommand(EXTENSION_CONFIG.DEFAULT_PREFIX + '.lambdaLog', async () => {
        if (!await wasAskCliInstalled()) {
            return;
        }
        if (!doesWorkSpaceExist()) {
            await askUserToPickAWorkspace(ERROR_AND_WARNING.CHECK_WORKSPACE_EXISTS.DEPLOY_AND_RELATED_ERROR_MESSAGE);
            return;
        }
        if (!await ProfileManager.getProfileList()) {
            ProfileManager.showProfileMissingAndSetupNotice();
            return;
        }
        await lambdaLog();
    }));
}

function addStatusBarItems(context: vscode.ExtensionContext) {
    const deployIcon = createStatusBarItem(
        1, 
        EXTENSION_CONFIG.DEFAULT_PREFIX + '.' + OPERATION.HIGH_LEVEL.DEPLOY.EXTENSION_REGISTERED_NAME,
        '$(cloud-upload) Deploy',
        'Deploy the Alexa skill package in the current workspace');

    const contactAlexaIcon = createStatusBarItem(
        2,
        EXTENSION_CONFIG.DEFAULT_PREFIX + '.' + OPERATION.EXTERNAL.CONTACT_ALEXA_TEAM.EXTENSION_REGISTERED_NAME,
        '$(mail) Contact Alexa',
        'Contact Alexa Team for any extension questions'
    );
    context.subscriptions.push(deployIcon);
    context.subscriptions.push(contactAlexaIcon);
}
