import * as vscode from "vscode";
import { CommandRunner } from "../../utils/commandRunner";
import { EXTENSION_CONFIG, VSCODE_SETTING_CONFIGURATION, OPERATION, ERROR_AND_WARNING } from "../../utils/configuration";
import { initializeHighLevelCommandWithProfile, doesWorkSpaceExist, askUserToPickAWorkspace } from "../../utils/highLevelCommandHelper";
import { wasAskCliInstalled } from "../../utils/askCliHelper";

/**
 * Build the deploy command with specific resource.
 * @param {string} commandName
 * @param {string} targetResource
 * @return {vscode.Disposable}
 */
export const composeDeployCommand = (commandName: string, targetResource?: string): vscode.Disposable => {
    return vscode.commands.registerCommand(commandName, async () => {
            if (!await wasAskCliInstalled()) {
                return;
            }
            if (!doesWorkSpaceExist()) {
                await askUserToPickAWorkspace(ERROR_AND_WARNING.CHECK_WORKSPACE_EXISTS.DEPLOY_AND_RELATED_ERROR_MESSAGE);
                return;
            }
            await deployCallback(targetResource);
        }
    );
};

const deployCallback = async (targetResource?: string) => {
    const deployCommand = await initializeHighLevelCommandWithProfile(OPERATION.HIGH_LEVEL.DEPLOY.COMMAND);
    if (!deployCommand) {
        return;
    }

    let finalDeployResource;
    if (!targetResource) {
        finalDeployResource = await resolveResourceAtRunTime();
    } else {
        finalDeployResource = targetResource;
    }
    deployCommand.commandParameters!.set('target', finalDeployResource);

    CommandRunner.runCommand(deployCommand);
};

/**
 * Find what resource the extension going to deploy.
 * @return {Promise<string>} The resource to be deployed.
 */
const resolveResourceAtRunTime = async () => {
    let resourceToDeploy: string|undefined = vscode.workspace.getConfiguration(EXTENSION_CONFIG.DEFAULT_PREFIX)
        .get(VSCODE_SETTING_CONFIGURATION.DEFAULT_DEPLOY_RESOURCE);
    if (!resourceToDeploy) {
        resourceToDeploy = await vscode.window.showQuickPick(EXTENSION_CONFIG.VALID_RESOURCES, {placeHolder: 'all'});
    }
    return resourceToDeploy;
};