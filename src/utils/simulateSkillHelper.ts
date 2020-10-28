import * as vscode from 'vscode';
import * as model from 'ask-smapi-model';
import SimulationResult = model.v2.skill.simulations.SimulationResult;
import SimulationsApiRequest = model.v2.skill.simulations.SimulationsApiRequest;
import SimulationsApiResponse = model.v2.skill.simulations.SimulationsApiResponse;
import { SmapiClientFactory, Utils } from '../runtime';
import { Logger } from '../logger';
import { loggableAskError } from '../exceptions';
import * as retry from 'async-retry';
import { getAvailableLocales } from '../utils/skillHelper';
import {
    SKILL, DEFAULT_SESSION_MODE, NEW_SESSION_MODE, ALEXA_RESPONSE_TYPES, SKILL_ACTION_URLS,
    ERRORS, SIMULATION_IN_PROGRESS, SIMULATOR_WEBVIEW_MESSAGES, SIMULATOR_MESSAGE_TYPE, EN_US_LOCALE,
    DEFAULT_PROFILE
} from '../constants';
import { IViewport } from "apl-suggester";
import { DEFAULT_VIEWPORT_CHARACTERISTICS } from "../aplContainer/utils/viewportProfileHelper";
import { getCurrentDate } from '../utils/dateHelper';
import R = require('ramda');
import { getSkillFolderInWs } from './workspaceHelper';
import { read, write } from '../runtime/lib/utils/jsonUtility';

let aplDataSource: string | undefined;
let aplDocument: string | undefined;
let aplViewport = DEFAULT_VIEWPORT_CHARACTERISTICS;
let currentLocale = EN_US_LOCALE;
let currentSkillId: string;
let isSkillEnabled: boolean = false;

/**
 * Handle message sent from Webview when skill status is changed or check skill status 
 * @param webviewMessage message sent from Webview
 * @param profile user profile
 * @param skillId Alexa Skill ID
 * @param context VSCode extension context
 */
export async function handleSkillStatusMessageFromWebview(webviewMessage: Record<string, any>, profile: string, skillId: string,
    context: vscode.ExtensionContext): Promise<string | Record<string, any>> {
    Logger.verbose(`Calling method: simulateSkillHelper.handleSkillStatusMessageFromWebview`);
    if (webviewMessage.message === SIMULATOR_WEBVIEW_MESSAGES.ENABLE_SKILL) {
        await enableSkill(profile, skillId, context);
        isSkillEnabled = true;
        return SIMULATOR_WEBVIEW_MESSAGES.ENABLED_SKILL;
    }
    else if (webviewMessage.message === SIMULATOR_WEBVIEW_MESSAGES.DISABLE_SKILL) {
        const skillEnabled = await checkSkillStatus(profile, skillId, context);
        if (skillEnabled) {
            await disableSkill(profile, skillId, context);
        }
        isSkillEnabled = false;
        return SIMULATOR_WEBVIEW_MESSAGES.DISABLED_SKILL;
    }
    else if (webviewMessage.message === SIMULATOR_WEBVIEW_MESSAGES.CHECK_SKILL_STATUS) {
        currentSkillId = skillId;
        const skillEnabled = await checkSkillStatus(profile, skillId, context);
        isSkillEnabled = skillEnabled;
        return (skillEnabled) ? SIMULATOR_WEBVIEW_MESSAGES.ENABLED_SKILL : SIMULATOR_WEBVIEW_MESSAGES.DISABLED_SKILL;
    }
    else {
        throw loggableAskError(ERRORS.UNRECOGNIZED_MESSAGE_FROM_WEBVIEW);
    }
}

/**
 * Handle message sent from Webview to check locales 
 * @param webviewMessage message sent from Webview
 * @param profile user profile
 * @param skillId Alexa Skill ID
 * @param context VSCode extension context
 */
export async function handleLocaleMessageFromWebview(webviewMessage: Record<string, any>, profile: string, skillId: string,
    context: vscode.ExtensionContext): Promise<void | Record<string, any>> {
    Logger.verbose(`Calling method: simulateSkillHelper.handleLocaleMessageFromWebview`);
    if (webviewMessage.message === SIMULATOR_WEBVIEW_MESSAGES.CHECK_AVAILABLE_LOCALES) {
        const availableLocales = await getAvailableLocales(profile, skillId, context);
        if(availableLocales.availableLocales.length < 1){
            Logger.error(`Cannot find locales in this skill: `, skillId);
        }
        currentLocale = (webviewMessage.currentLocale !== undefined)? webviewMessage.currentLocale : availableLocales.availableLocales[0];
        return ({
            locale: availableLocales,
            type: SIMULATOR_MESSAGE_TYPE.LOCALE
        });
    }
    else if (webviewMessage.message === SIMULATOR_WEBVIEW_MESSAGES.UPDATE_LOCALE) {
        currentLocale = webviewMessage.skillLocale;
    }

    else {
        throw loggableAskError(ERRORS.UNRECOGNIZED_MESSAGE_FROM_WEBVIEW);
    }
}

/**
 * Handle message sent from Webview when user enters input into chat box
 * @param webviewMessage message sent from Webview
 * @param profile user profile
 * @param skillId Alexa Skill ID
 * @param context VSCode extension context
 */
export async function handleUtteranceMessageFromWebview(webviewMessage: Record<string, any>, profile: string,
    skillId: string, context: vscode.ExtensionContext): Promise<void | Record<string, any>> {
    Logger.verbose(`Calling method: simulateSkillHelper.handleUtteranceMessageFromWebview`);
    const userInput: string = webviewMessage.userInput;
    const skillLocale: string = webviewMessage.skillLocale;
    const sessionMode: boolean = webviewMessage.sessionMode;
    try {
        const simulationResult = await getSimulationResponse(userInput, skillLocale, sessionMode, profile, skillId, context);
        const returnMessage = formatAlexaResponse(simulationResult, skillId);

        if (returnMessage.type !== SIMULATOR_MESSAGE_TYPE.UTTERANCE && returnMessage.type !== SIMULATOR_MESSAGE_TYPE.EXCEPTION) {
            throw loggableAskError(ERRORS.UNRECOGNIZED_SIMULATION_RETURN_MESSAGE);
        }
        return returnMessage;
    }
    catch (err) {
        throw loggableAskError(ERRORS.SIMULATION_REQUEST_FAIL, err, true);
    }
}


/**
 * Handle message sent from Webview when user click export button
 * @param webviewMessage message sent from Webview
 * @param skillId Alexa Skill ID
 * @param skillName
 */
export function handleExportMessageFromWebview(webviewMessage: Record<string, any>,
    skillId: string, skillName: string, context: vscode.ExtensionContext): Promise<void | Record<string, any>> {
    Logger.verbose(`Calling method: simulateSkillHelper.handleExportMessageFromWebview`);
    return exportFileForReplay(webviewMessage, skillId, skillName, context);
}

/**
 * Handle message sent from Webview when user click preview div
 * @param webviewMessage message sent from Webview
 * @param skillId Alexa Skill ID
 */
export function handleActionMessageFromWebview(webviewMessage: Record<string, any>, skillId: string) {
    Logger.verbose(`Calling method: simulateSkillHelper.handleActionMessageFromWebview`);
    let locale = webviewMessage.locale ? webviewMessage.locale : 'en-US';
    locale = locale.replace('-', '_');
    const goToConsole = 'Go to Alexa Developer Console';
    const link = SKILL_ACTION_URLS.SIMULATOR(skillId, locale);
    vscode.window.showInformationMessage('This extension does not support interacting with the Alexa Presentation Language. ', goToConsole)
        .then(selection => {
            if (selection === goToConsole) {
                vscode.env.openExternal(vscode.Uri.parse(link));
            }
        });
}

/**
 * Choose replay file then replay conversation automatically.
 */
export async function getReplayList(): Promise<void | Record<string, any>> {
    Logger.verbose(`Calling method: simulateSkillHelper.getReplayList`);

    const selectFileDialog = await vscode.window.showOpenDialog({
        "canSelectFiles": true,
        "canSelectFolders": false,
        "canSelectMany": false,
        "filters": {
            "Json": ["json"]
        }
    });
    const filePath = selectFileDialog ? selectFileDialog[0].fsPath : '';
    if (filePath === '') {
        return;
    }
    let inputList = [];
    try {
        const jsonObject = read(filePath);
        inputList = jsonObject.userInput;
        const locale = jsonObject.locale;
        if (isSkillEnabled === false) {
            void vscode.window.showErrorMessage(ERRORS.REPLAY_FAILED_ENABLE);
            return;
        }
        else if (locale !== currentLocale) {
            vscode.window.showErrorMessage(ERRORS.REPLAY_FAILED_LOCALE);
            return;
        }
        else if (inputList.length <= 0) {
            vscode.window.showErrorMessage(ERRORS.REPLAY_FAILED);
            return;
        }
    } catch (err) {
        throw loggableAskError(ERRORS.OPEN_REPLAY_FILE_FAIL(filePath), err, true);
    }

    const returnMessage: Record<string, any> = ({
        replay: inputList,
        type: SIMULATOR_MESSAGE_TYPE.REPLAY
    });
    return returnMessage;
}

/**
 * Export utterances of the current session for replay.
 * @param webviewMessage message sent from Webview
 * @param skillId Alexa Skill ID
 */
export async function exportFileForReplay(message: Record<string, any>, skillId: string, skillName: string, context: vscode.ExtensionContext): Promise<void> {
    Logger.verbose(`Calling method: simulateSkillHelper.exportFileForReplay`);

    if (message.exportUtterance === undefined || message.exportUtterance.length <= 0) {
        vscode.window.showWarningMessage(ERRORS.EXPORT_FAILED);
        return;
    }
    const exportContent = {
        skillId: skillId,
        locale: message.skillLocale,
        userInput: message.exportUtterance
    }

    const dateToday = getCurrentDate();
    skillName = skillName.replace(' ', '');
    const skillLocale = currentLocale.replace('-', '_').toLowerCase();
    const skillFolder = getSkillFolderInWs(context)?.fsPath; 
    const fileName = vscode.Uri.file(skillFolder + '/' + skillName + '_' + skillLocale + '_' + dateToday);

    const saveFileDialog = await vscode.window.showSaveDialog({
        defaultUri: fileName,
        filters: {
            "Json": ["json"]
        }
    });

    if (saveFileDialog === undefined) {
        return;
    }
    const filePath = saveFileDialog.fsPath;
    write(filePath, exportContent);

    const saveFileMsg = 'Simulator success: The file was saved in ' + filePath;
    vscode.window.showInformationMessage(saveFileMsg);
    return;
}


/**
 * Calls SMAPI Skill Enablement API to enable skill in Development stage
 * @param profile user profile
 * @param skillId Alexa Skill ID
 * @param context VSCode extension context 
 */
export async function enableSkill(profile: string, skillId: string, context: vscode.ExtensionContext): Promise<void> {
    Logger.verbose(`Calling method: simulateSkillHelper.enableSkill`);
    // hard-coding Development stage (no support for Live testing)
    try {
        await SmapiClientFactory.getInstance(profile, context)
            .setSkillEnablementV1(skillId, SKILL.STAGE.DEVELOPMENT);
    }
    catch (err) {
        throw loggableAskError(ERRORS.SKILL_ENABLEMENT_FAIL, err, true);
    }
}

/**
 * Calls SMAPI Skill Enablement API to delete skill enablement for Development stage
 * @param profile user profile 
 * @param skillId Alexa Skill ID
 * @param context VSCode extension context 
 */
export async function disableSkill(profile: string, skillId: string, context: vscode.ExtensionContext): Promise<void> {
    Logger.verbose(`Calling method: simulateSkillHelper.disableSkill`);
    try {
        await SmapiClientFactory.getInstance(profile, context)
            .deleteSkillEnablementV1(skillId, SKILL.STAGE.DEVELOPMENT);
    }
    catch (err) {
        throw loggableAskError(ERRORS.SKILL_DISABLEMENT_FAIL, err, true);
    }
}


/**
 * Calls SMAPI Skill Enablement API to check if the skill has been enabled for testing
 * in the Development stage (returns 204 if enablement exists & throws error otherwise)
 * @param profile user profile
 * @param skillId Alexa Skill ID
 * @param context VSCode extension context
 */
export async function checkSkillStatus(profile: string, skillId: string, context: vscode.ExtensionContext): Promise<boolean> {
    Logger.verbose(`Calling method: simulateSkillHelper.checkSkillStatus`);
    let apiResponse: model.runtime.ApiResponse;
    try {
        apiResponse = await SmapiClientFactory.getInstance(profile, context)
            .callGetSkillEnablementStatusV1(skillId, SKILL.STAGE.DEVELOPMENT);
    }
    catch (err) {
        if(err.statusCode === 401) {
            const profile = Utils.getCachedProfile(context) ?? DEFAULT_PROFILE;
            vscode.window.showErrorMessage(ERRORS.PROFILE_ERROR(profile));
        }
        else {
            vscode.window.showInformationMessage("The skill is off. Set the skill stage to development.");
        }
        Logger.error(err);
        return false;
    }
    return (apiResponse.statusCode === 204);
}


/**
 * Calls Skill Simulation API to get Alexa's response to user input
 * @param userInput user's chat box input
 * @param skillLocale selected interaction model locale
 * @param profile user profile
 * @param skillId Alexa Skill ID
 * @param context VSCode extension context 
 * @returns {string|SimulationResult} failed simulation error message OR successful simulation result
 */
export async function getSimulationResponse(userInput: string, skillLocale: string, createNewSession: boolean, profile: string, skillId: string, context: vscode.ExtensionContext): Promise<Record<string, any> | SimulationResult> {
    Logger.verbose(`Calling method: simulateSkillHelper.getSimulationResponse, args: `, userInput);

    const retryOptions: retry.Options = {
        retries: 6,
        minTimeout: 500,
        maxTimeout: 8000,
        randomize: false
    };

    const SESSION_MODE = (createNewSession === true) ? NEW_SESSION_MODE : DEFAULT_SESSION_MODE;

    const payload: SimulationsApiRequest = {
        'input': { 'content': userInput },
        'device': { 'locale': skillLocale },
        'session': { 'mode': SESSION_MODE }
    };

    let simulationResponse: SimulationsApiResponse;
    try {
        simulationResponse = await SmapiClientFactory
            .getInstance(profile, context)
            .simulateSkillV2(skillId,
                SKILL.STAGE.DEVELOPMENT, payload);
    } catch (err) {
        if (err.statusCode === 401) {
            const profile = Utils.getCachedProfile(context) ?? DEFAULT_PROFILE;
            vscode.window.showErrorMessage(ERRORS.PROFILE_ERROR(profile));
        }
        else {
            vscode.window.showErrorMessage(err.message);
        }
        Logger.error(err);
        return ({
            clientException: err.statusCode,
            type: SIMULATOR_MESSAGE_TYPE.EXCEPTION
        });
    }

    const simulationId: string | undefined = simulationResponse.id;

    if (typeof simulationId === 'string') {
        return retry(async (bail: (err: Error) => void, attempt: number): Promise<Record<string, any> | SimulationResult> => {
            Logger.verbose(`Retrying simulation request, attempt: ${attempt}`);
            const simulationResponseContent = await SmapiClientFactory.getInstance(profile, context)
                .getSkillSimulationV2(skillId,
                    SKILL.STAGE.DEVELOPMENT, simulationId);

            if (simulationResponseContent.status === SKILL.SIMULATION_STATUS.IN_PROGRESS) {
                throw loggableAskError(SIMULATION_IN_PROGRESS);
            }

            if (simulationResponseContent.status === SKILL.SIMULATION_STATUS.FAILURE) {
                const errorMessage: string | undefined = simulationResponseContent.result?.error?.message;
                let response = '';
                if (typeof errorMessage === 'string') {
                    response = 'Error: ' + errorMessage;
                }
                else { response = 'Error: undefined'; }
                return ({
                    errorResponse: response,
                    type: SIMULATOR_MESSAGE_TYPE.UTTERANCE
                });
            }
            else {
                const simulationResult: SimulationResult | undefined = simulationResponseContent.result;
                if (!simulationResult) {
                    throw loggableAskError(ERRORS.SIMULATION_REQUEST_FAIL);
                }
                return simulationResult;
            }
        }, retryOptions);
    }
    else {
        throw loggableAskError(ERRORS.UNDEFINED_SIMULATION_ID);
    }
}

/**
 * Formats Alexa's response to send back in message to Webview
 * @param simulationResult JSON data returned from simulation response
 * @returns object containing array of Alexa responses & JSON bodies of invocationRequest and invocationResponse data
 */
export function formatAlexaResponse(simulationResult: Record<string, any> | SimulationResult, skillId: string): Record<string, any> {
    Logger.verbose(`Calling method: simulateSkillHelper.formatAlexaResponse`);
    if ('clientException' in simulationResult || 'errorResponse' in simulationResult) {
        return simulationResult;
    }
    else {
        const invocationRequestBodies: Array<Record<string, any>> | undefined = [];
        const invocationResponseBodies: Array<Record<string, any>> | undefined = [];
        const invocationsArray = simulationResult.skillExecutionInfo?.invocations;
        if (invocationsArray) {
            for (const invocation of invocationsArray) {
                if (invocation.invocationRequest?.body && invocation.invocationResponse?.body) {
                    invocationRequestBodies.push(invocation.invocationRequest?.body);
                    invocationResponseBodies.push(invocation.invocationResponse?.body);
                }
            }
        }

        const alexaExecutionInfo = simulationResult.alexaExecutionInfo;
        const alexaResponseArray: model.v2.skill.simulations.AlexaResponse[] | undefined =
            simulationResult.alexaExecutionInfo?.alexaResponses;
        const alexaResponseTextContents: string[] = [];

        if (alexaResponseArray) {
            for (const response of alexaResponseArray) {
                // Currently, only possible response type returned by the API is "Speech"
                // otherwise, response.type would be undefined
                if (response.type === ALEXA_RESPONSE_TYPES.SPEECH
                    && typeof response.content?.caption === 'string') {
                    alexaResponseTextContents.push(response.content?.caption);
                }
                else {
                    throw loggableAskError(`${ERRORS.UNRECOGNIZED_ALEXA_RESPONSE_TYPE(response.type)}`);
                }
            }
        }

        //get datasource and document
        let aplDataSourceTmp: string | undefined;
        let aplDocumentTmp: string | undefined;
        for (const responseBody of invocationResponseBodies) {
            let directives = responseBody.response?.directives;
            if (directives != null) {
                for (const directive of directives) {
                    if (directive.type === 'Alexa.Presentation.APL.RenderDocument') {
                        aplDataSourceTmp = JSON.stringify(directive.datasources);
                        aplDocumentTmp = JSON.stringify(directive.document);
                    }
                }
            }
        }
        aplDataSource = aplDataSourceTmp;
        aplDocument = aplDocumentTmp;

        return ({
            invocationRequests: invocationRequestBodies,
            invocationResponses: invocationResponseBodies,
            alexaExecutionInfo: alexaExecutionInfo,
            alexaResponse: alexaResponseTextContents,
            documents: aplDocument,
            dataSources: aplDataSource,
            viewport: JSON.stringify(aplViewport),
            skillId: skillId,
            type: SIMULATOR_MESSAGE_TYPE.UTTERANCE
        });
    }
}


/**
 * Renew the aplViewport and send to webview.
 * @param new viewport
 * @returns object containing viewport type and document.
 */
export function getNewViewPortMessage(viewport: IViewport): Record<string, any> {
    aplViewport = viewport;
    return {
        newViewport: JSON.stringify(aplViewport),
        documents: aplDocument,
        dataSources: aplDataSource,
        type: SIMULATOR_MESSAGE_TYPE.VIEWPORT
    }
}