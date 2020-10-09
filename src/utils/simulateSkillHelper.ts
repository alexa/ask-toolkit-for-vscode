import * as vscode from 'vscode';
import * as model from 'ask-smapi-model';
import SimulationResult = model.v2.skill.simulations.SimulationResult;
import SimulationsApiRequest = model.v2.skill.simulations.SimulationsApiRequest;
import SimulationsApiResponse = model.v2.skill.simulations.SimulationsApiResponse;
import { SmapiClientFactory, Utils } from '../runtime';
import { Logger } from '../logger';
import { loggableAskError } from '../exceptions';
import * as retry from 'async-retry';
import {aplViewport} from './simulateReplayHelper';
import {
    SKILL, DEFAULT_SESSION_MODE, NEW_SESSION_MODE, ALEXA_RESPONSE_TYPES,
    ERRORS, SIMULATION_IN_PROGRESS, SIMULATOR_MESSAGE_TYPE, DEFAULT_PROFILE
} from '../constants';


export let aplDataSource: string | undefined;
export let aplDocument: string | undefined;

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
        if (err.statusCode === 401) {
            const profile = Utils.getCachedProfile(context) ?? DEFAULT_PROFILE;
            void vscode.window.showErrorMessage(ERRORS.PROFILE_ERROR(profile));
        }
        else {
            void vscode.window.showInformationMessage("The skill is off. Set the skill stage to development.");
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

    const SESSION_MODE = createNewSession ? NEW_SESSION_MODE : DEFAULT_SESSION_MODE;

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
            void vscode.window.showErrorMessage(ERRORS.PROFILE_ERROR(profile));
        }
        else {
            void vscode.window.showErrorMessage(err.message);
        }
        Logger.error(err);
        return ({
            clientException: err.statusCode,
            type: SIMULATOR_MESSAGE_TYPE.EXCEPTION
        });
    }

    const simulationId: string | undefined = simulationResponse.id;

    if (simulationId !== undefined) {
        return retry(async (bail: (err: Error) => void, attempt: number): Promise<Record<string, any> | SimulationResult> => {
            Logger.verbose(`Retrying simulation request, attempt: ${attempt}`);
            const simulationResponseContent = await SmapiClientFactory.getInstance(profile, context)
                .getSkillSimulationV2(skillId,
                    SKILL.STAGE.DEVELOPMENT, simulationId);

            if (simulationResponseContent.status === SKILL.SIMULATION_STATUS.IN_PROGRESS) {
                throw loggableAskError(SIMULATION_IN_PROGRESS);
            }

            else if (simulationResponseContent.status === SKILL.SIMULATION_STATUS.FAILURE) {
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
        if (invocationsArray !== undefined) {
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
            const directives = responseBody.response?.directives;
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
            alexaExecutionInfo,
            alexaResponse: alexaResponseTextContents,
            documents: aplDocument,
            dataSources: aplDataSource,
            viewport: JSON.stringify(aplViewport),
            skillId,
            type: SIMULATOR_MESSAGE_TYPE.UTTERANCE
        });
    }
}




