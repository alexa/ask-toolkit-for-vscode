'use strict';

import * as vscode from 'vscode';
import {
    EXTENSION_CONFIG, OPERATION, ERROR_AND_WARNING
} from "../utils/configuration";
import { createSkill } from './lowLevelCommands/create-skill';
import { enableSkill } from './lowLevelCommands/enable-skill';
import { addPrivateDistributionAccount } from './lowLevelCommands/add-private-distribution-account';
import { associateIsp } from './lowLevelCommands/associate-isp';
import { createIsp } from './lowLevelCommands/create-isp';
import { deleteAccountLinking } from './lowLevelCommands/delete-account-linking';
import { deleteIsp } from './lowLevelCommands/delete-isp';
import { deletePrivateDistributionAccount } from './lowLevelCommands/delete-private-distribution-account';
import { deleteSkill } from './lowLevelCommands/delete-skill';
import { disableSkill } from './lowLevelCommands/disable-skill';
import { disassociateIsp } from './lowLevelCommands/disassociate-isp';
import { getAccountLinking } from './lowLevelCommands/get-account-linking';
import { getIsp } from './lowLevelCommands/get-isp';
import { getModel } from './lowLevelCommands/get-model';
import { getSimulation } from './lowLevelCommands/get-simulation';
import { getSkillEnablement } from './lowLevelCommands/get-skill-enablement';
import { getSkillStatus } from './lowLevelCommands/get-skill-status';
import { getSkill } from './lowLevelCommands/get-skill';
import { getValidation } from './lowLevelCommands/get-validation';
import { headModel } from './lowLevelCommands/head-model';
import { invokeSkill } from './lowLevelCommands/invoke-skill';
import { listIspForSkill } from './lowLevelCommands/list-isp-for-skill';
import { listIspForVendor } from './lowLevelCommands/list-isp-for-vendor';
import { listPrivateDistributionAccounts } from './lowLevelCommands/list-private-distribution-accounts';
import { listSkillsForIsp } from './lowLevelCommands/list-skills-for-isp';
import { listSkills } from './lowLevelCommands/list-skills';
import { listVendors } from './lowLevelCommands/list-vendors';
import { resetIspEntitlement } from './lowLevelCommands/reset-isp-entitlement';
import { simulateSkill } from './lowLevelCommands/simulate-skill';
import { submit } from './lowLevelCommands/submit';
import { updateIsp } from './lowLevelCommands/update-isp';
import { updateModel } from './lowLevelCommands/update-model';
import { validateSkill } from './lowLevelCommands/validate-skill';
import { withdraw } from './lowLevelCommands/withdraw';
import { updateSkill } from './lowLevelCommands/update-skill';
import { lambdaLog } from './lowLevelCommands/lambda-log';
import { intentRequestsHistory } from './lowLevelCommands/intent-requests-history';
import { createAccountLinking } from './lowLevelCommands/create-account-linking';
import { wasAskCliInstalled } from '../utils/askCliHelper';
import { ProfileManager } from '../utils/profileManager';
import { doesWorkSpaceExist, askUserToPickAWorkspace } from '../utils/highLevelCommandHelper';

const COMMAND_NAME = EXTENSION_CONFIG.DEFAULT_PREFIX + '.' + 'lowLevelCommands';
const LOW_LEVEL_OPERATION = OPERATION.LOW_LEVEL;

export const askLowLevelCommands = vscode.commands.registerCommand(COMMAND_NAME, async () => {
    if (!await wasAskCliInstalled()) {
        return;
    }

    if (!doesWorkSpaceExist()) {
        await askUserToPickAWorkspace(ERROR_AND_WARNING.CHECK_WORKSPACE_EXISTS.DEPLOY_AND_RELATED_ERROR_MESSAGE);
        return;
    }

    let cachedProfileList = await ProfileManager.getProfileList();
    if (cachedProfileList.length === 0) {
        ProfileManager.showProfileMissingAndSetupNotice();
        return;
    }

    const lowLevelCommandsMapping = new Map<string, Function>();
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.ADD_PRIVATE_DISTRIBUTION_ACCOUNT.TITLE, addPrivateDistributionAccount);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.ASSOCIATE_ISP.TITLE, associateIsp);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.CREATE_ISP.TITLE, createIsp);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.CREATE_SKILL.TITLE, createSkill);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.DELETE_ACCOUNT_LINKING.TITLE, deleteAccountLinking);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.DELETE_ISP.TITLE, deleteIsp);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.DELETE_PRIVATE_DISTRIBUTION_ACCOUNT.TITLE, deletePrivateDistributionAccount);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.DELETE_SKILL.TITLE, deleteSkill);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.DISABLE_SKILL.TITLE, disableSkill);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.DISASSOCIATE_ISP.TITLE, disassociateIsp);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.ENABLE_SKILL.TITLE, enableSkill);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.GET_ACCOUNT_LINKING.TITLE, getAccountLinking);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.GET_ISP.TITLE, getIsp);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.GET_MODEL.TITLE, getModel);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.GET_SIMULATION.TITLE, getSimulation);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.GET_SKILL_ENABLEMENT.TITLE, getSkillEnablement);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.GET_SKILL_STATUS.TITLE, getSkillStatus);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.GET_SKILL.TITLE, getSkill);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.GET_VALIDATION.TITLE, getValidation);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.HEAD_MODEL.TITLE, headModel);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.INTENT_REQUESTS_HISTORY.TITLE, intentRequestsHistory);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.INVOKE_SKILL.TITLE, invokeSkill);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.LIST_ISP_FOR_SKILL.TITLE, listIspForSkill);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.LIST_ISP_FOR_VENDOR.TITLE, listIspForVendor);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.LIST_PRIVATE_DISTRIBUTION_ACCOUNTS.TITLE, listPrivateDistributionAccounts);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.LIST_SKILLS_FOR_ISP.TITLE, listSkillsForIsp);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.LIST_SKILLS.TITLE, listSkills);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.LIST_VENDORS.TITLE, listVendors);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.RESET_ISP_ENTITLEMENT.TITLE, resetIspEntitlement);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.SIMULATE_SKILL.TITLE, simulateSkill);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.SUBMIT.TITLE, submit);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.UPDATE_ISP.TITLE, updateIsp);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.UPDATE_MODEL.TITLE, updateModel);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.UPDATE_SKILL.TITLE, updateSkill);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.VALIDATE_SKILL.TITLE, validateSkill);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.WITHDRAW.TITLE, withdraw);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.LAMBDA_LOG.TITLE, lambdaLog);
    lowLevelCommandsMapping.set(LOW_LEVEL_OPERATION.CREATE_ACCOUNT_LINKING.TITLE, createAccountLinking);

    const quickPickList = Array.from(lowLevelCommandsMapping.keys());
    const pickedItem = await vscode.window.showQuickPick(quickPickList);
    if (!pickedItem) {
        throw new Error('Process aborted. No command has been picked.');
    }
    const pickCommand = lowLevelCommandsMapping.get(pickedItem);
    //trigger the command
    pickCommand!();
});
