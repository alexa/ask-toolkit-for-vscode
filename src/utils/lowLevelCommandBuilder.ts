'use strict';
import * as vscode from 'vscode';
import { ICommand } from './commandRunner';
import { EXTENSION_CONFIG, ERROR_AND_WARNING } from './configuration';
import * as R from 'ramda';
import { ProfileManager } from './profileManager';
import { turnIProfileObjectIntoQuickPickItem } from './commandParametersHelper';

export class LowLevelCommandBuilder {
    /**
     * Uses the prompt method that defined in requiredParameter object to query the parameter value from the user.
     * @param {IRequiredInputParameter[]} requiredParameters 
     * @returns {Promise<Map<string, any>>} a map that contains the query parameters and their values
     */
    private static async queryParameters(requiredParameters: IRequiredInputParameter[]) {
        const queryParametersMap = new Map<string, any>();
        for (let requiredParam of requiredParameters) {
            let paramValue: any = undefined;
            switch (requiredParam.queryInputMethod) {
                case 'showInputBox':
                    paramValue = await vscode.window.showInputBox(<vscode.InputBoxOptions>requiredParam.options);
                    break;
                case 'showQuickPick':
                    const quickPickResult = await vscode.window.showQuickPick(requiredParam.quickPick!.items, <vscode.QuickPickOptions>requiredParam.options);

                    paramValue = !quickPickResult? undefined :
                                !requiredParam.quickPick!.postProcess?  quickPickResult.label :
                                requiredParam.quickPick!.postProcess!(quickPickResult.label);
                    break;
                
                case 'showOpenDialog':
                    const file = await vscode.window.showOpenDialog(<vscode.OpenDialogOptions>requiredParam.options);
                    paramValue = file ? file[0].fsPath : undefined;
                    break;
                    
                default:
                    throw new Error(`Invalid 'queryInputMethod' for parameter '${requiredParam.parameterName}'.`);
            }


            if (typeof paramValue === 'boolean') {
                    queryParametersMap.set(requiredParam.parameterName, paramValue);
                    continue;
            } 
            
            
            if (paramValue) {
                queryParametersMap.set(requiredParam.parameterName, paramValue);
            } 
            // If it's an empty string, it means can be omitted. 
            // The business logic should be controlled by requiredParam object.
            else if (typeof paramValue === 'string' && paramValue.length === 0) {
                continue;
            } else {
                if (typeof requiredParam.isRequired === 'boolean' && requiredParam.isRequired === false) {
                // such as profile and eTag can be omitted. 
                // if the user didn't input anything, the builder will omit this parameter.
                    continue;
                } 
                const errorMessage = `Process aborted due to ${requiredParam.parameterName}, ${requiredParam.quickPick!.items.toString()} is omitted.`;
                throw new Error(errorMessage);
            }
        }
        return queryParametersMap;
    }

    /**
     * Finds the parameters from the 'Settings' in VS Code if applicable.
     * @param {IRequiredInputParameter[]} requiredParameters
     * @returns {[Map<string, any>, IRequiredInputParameter[]]} An array which first item is parameters key-value map, second item is the parameters that don't have predefined value in 'Setting'.
     */
    private static findParamValueFromSetting(requiredParameters: IRequiredInputParameter[]) {
        const defaultConfigValueMap = new Map<string, any>();
        const getConfigValueIfPossible = R.map((requiredParam: IRequiredInputParameter): void|IRequiredInputParameter => {
            if (!requiredParam.configKey) {
                return requiredParam;
            }
            const configValue = vscode.workspace.getConfiguration(EXTENSION_CONFIG.DEFAULT_PREFIX).get(requiredParam.configKey.configName);
            // the value can be boolean, so only undefined means there is no predefined value.
            // sometime it returns an empty string instead of 'undefined'
            if (configValue === undefined || 
                (typeof configValue === 'string' && configValue.length === 0)) {
                return requiredParam;
            }
            const parameterValue = requiredParam.configKey.postProcess? requiredParam.configKey.postProcess(configValue) : configValue;
            // cannot compute the value by the postProcess function, then extension should ask the user's input.
            if (parameterValue === undefined || (typeof parameterValue === 'string' && parameterValue.length === 0)) {
                return requiredParam;
            }

            // if the value is boolean, it indicates the parameter is a stand alone flag without any value. e.g., --debug
            if (typeof parameterValue === 'boolean' ) {
                // the flag should only show up if it's true, omitted otherwise.
                if (parameterValue === true) {
                    defaultConfigValueMap.set(requiredParam.parameterName, undefined);
                }
            } else {
                defaultConfigValueMap.set(requiredParam.parameterName, parameterValue);
            }
        });
        const removeUndefinedValueFromList = R.filter((item: IRequiredInputParameter|void) => {
            return !!item;
        });
        const noPreDefinedParameters = removeUndefinedValueFromList(<IRequiredInputParameter[]>getConfigValueIfPossible(requiredParameters));
        // tuple approach.
        return [defaultConfigValueMap, noPreDefinedParameters];
    }
    
    /**
     * Build ICommand object.
     * @param {string} cliCommand command name, e.g. 'api' in `ask api create-skill`
     * @param {string} cliSubCommand subcommand name, e.g. 'create-skill' in `ask api create-skill`
     * @param requiredParameters 
     * @returns {Promise<ICommand>} ICommand Object that can be directly consumed by CommandRunner.
     */
    public static async buildCommand(cliCommand: string, cliSubCommand: string, requiredParameters: IRequiredInputParameter[]) {
        // profile option is required for all operations.
        // don't need to check whether profileParameter exist or not since the on top, it already check. The workflow won't get
        // to here if the profileList check failed.
        const profileParameter = await getProfileParamForLowLevelCommand();
        requiredParameters.push(profileParameter);

        let requiredParametersMap: Map<string, any>;
        const resultTuple = this.findParamValueFromSetting(requiredParameters);
        const defaultConfigValueMap = <Map<string, any>>resultTuple[0];
        const noPreDefinedParameters = <IRequiredInputParameter[]>resultTuple[1];
        if (!noPreDefinedParameters || noPreDefinedParameters.length === 0) {
            requiredParametersMap = defaultConfigValueMap;
        } else {
            try {
                const queryParametersMap = await this.queryParameters(noPreDefinedParameters);
                requiredParametersMap = new Map([...queryParametersMap, ...defaultConfigValueMap]);
            } catch (error) {
                throw error;
            }
        }
        
        return <ICommand> {
            command: cliCommand,
            subCommand: cliSubCommand,
            commandParameters: requiredParametersMap
        };
    }
}

/**
 * @param {string} parameterName name of the input parameter.
 * @param {inputMethodEnum} queryInputMethod the method will be used to query the parameter from the users.
 * @param {IQuickPick} quickPick contains a list of quickPickItems and possible a postProcess function. 
 * @param {vscode.InputBoxOptions | vscode.QuickPickOptions} options vscode options for the queryInputMethod. e.g. placeholder.
 * @param {IConfigKey} configKey config name in the 'Setting' that maps to the parameter. e.g. "profile" in "ask.profile".
 */
export interface IRequiredInputParameter {
    readonly parameterName: string;
    readonly queryInputMethod: inputMethodEnum;
    readonly quickPick?: IQuickPick;
    readonly options?: vscode.InputBoxOptions | vscode.QuickPickOptions | vscode.OpenDialogOptions;
    readonly configKey?: IConfigKey;
    isRequired?: boolean;
}

/**
 * @param {vscode.QuickPickItem[]} items the list of items the user can choose from if the queryInputMethod is 'showQuickPick'.
 * @param {Function} postProcess the function that process the picked item.
 */
export interface IQuickPick {
    items: vscode.QuickPickItem[];
    postProcess?: Function;
}

type inputMethodEnum = 'showInputBox' | 'showQuickPick' | 'showOpenDialog';

/**
 * @param {string} configName name for the default configuration in 'Setting'. e.g. "profile" in "ask.profile".
 * @param {Function} postProcess the function that process the config value from the 'Setting'.
 */
export interface IConfigKey {
    configName: string;
    postProcess?: Function;
}


/**
 * adding the profile parameter in the the parameter list.
 * @param commandInputParameters the command parameter list that passed into the lowLevelCommandBuilder
 */
async function getProfileParamForLowLevelCommand() {
    const cachedProfileList = await ProfileManager.getProfileList();
   
    const result = <IRequiredInputParameter> {
        parameterName: 'profile',
        queryInputMethod: 'showQuickPick',
        options: <vscode.QuickPickOptions> {
            placeHolder: ERROR_AND_WARNING.QUICK_PICK_PLACE_HOLDER
        },
        quickPick: {
            items: (cachedProfileList).map(turnIProfileObjectIntoQuickPickItem)
        },
        configKey: {
            configName: 'profile'
        }
    };
    return result;
}