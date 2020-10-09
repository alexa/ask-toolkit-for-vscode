import * as vscode from 'vscode';
import { Logger } from '../logger';
import { loggableAskError } from '../exceptions';
import { getAvailableLocales } from '../utils/skillHelper';
import {
    SKILL_ACTION_URLS,
    ERRORS, SIMULATOR_WEBVIEW_MESSAGES, SIMULATOR_MESSAGE_TYPE, EN_US_LOCALE
} from '../constants';
import * as simulateSkillHelper from '../utils/simulateSkillHelper';
import { exportFileForReplay } from './simulateReplayHelper';

export let currentLocale = EN_US_LOCALE;
export let currentSkillId: string;
export let isSkillEnabled = false;

/**
 * Handle message sent from Webview when skill status is changed or check skill status 
 * @param webviewMessage message sent from Webview
 * @param profile user profile
 * @param skillId Alexa Skill ID
 * @param context VSCode extension context
 */
export async function handleSkillStatusMessageFromWebview(webviewMessage: Record<string, any>, profile: string, skillId: string,
    context: vscode.ExtensionContext): Promise<string> {
    Logger.verbose(`Calling method: simulateMessageHelper.handleSkillStatusMessageFromWebview`);
    if (webviewMessage.message === SIMULATOR_WEBVIEW_MESSAGES.ENABLE_SKILL) {
        await simulateSkillHelper.enableSkill(profile, skillId, context);
        isSkillEnabled = true;
        return SIMULATOR_WEBVIEW_MESSAGES.ENABLED_SKILL;
    }
    else if (webviewMessage.message === SIMULATOR_WEBVIEW_MESSAGES.DISABLE_SKILL) {
        const skillEnabled = await simulateSkillHelper.checkSkillStatus(profile, skillId, context);
        if (skillEnabled) {
            await simulateSkillHelper.disableSkill(profile, skillId, context);
        }
        isSkillEnabled = false;
        return SIMULATOR_WEBVIEW_MESSAGES.DISABLED_SKILL;
    }
    else if (webviewMessage.message === SIMULATOR_WEBVIEW_MESSAGES.CHECK_SKILL_STATUS) {
        currentSkillId = skillId;
        const skillEnabled = await simulateSkillHelper.checkSkillStatus(profile, skillId, context);
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
    Logger.verbose(`Calling method: simulateMessageHelper.handleLocaleMessageFromWebview`);
    if (webviewMessage.message === SIMULATOR_WEBVIEW_MESSAGES.CHECK_AVAILABLE_LOCALES) {
        const availableLocales = await getAvailableLocales(profile, skillId, context);
        if (availableLocales.availableLocales.length < 1) {
            Logger.error(`Cannot find locales in this skill: `, skillId);
        }
        currentLocale = (webviewMessage.currentLocale !== undefined) ? webviewMessage.currentLocale : availableLocales.availableLocales[0];
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
    Logger.verbose(`Calling method: simulateMessageHelper.handleUtteranceMessageFromWebview`);
    const userInput: string = webviewMessage.userInput;
    const skillLocale: string = webviewMessage.skillLocale;
    const sessionMode: boolean = webviewMessage.sessionMode;
    try {
        const simulationResult = await simulateSkillHelper.getSimulationResponse(userInput, skillLocale, sessionMode, profile, skillId, context);
        const returnMessage = simulateSkillHelper.formatAlexaResponse(simulationResult, skillId);

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
export async function handleExportMessageFromWebview(webviewMessage: Record<string, any>,
    skillId: string, skillName: string, context: vscode.ExtensionContext): Promise<void> {
    Logger.verbose(`Calling method: simulateMessageHelper.handleExportMessageFromWebview`);
    await exportFileForReplay(webviewMessage, skillId, skillName, context);
}

/**
 * Handle message sent from Webview when user click preview div
 * @param webviewMessage message sent from Webview
 * @param skillId Alexa Skill ID
 */
export function handleActionMessageFromWebview(webviewMessage: Record<string, string>, skillId: string): void {
    Logger.verbose(`Calling method: simulateMessageHelper.handleActionMessageFromWebview`);
    let locale = webviewMessage.locale ? webviewMessage.locale : 'en-US';
    locale = locale.replace('-', '_');
    const goToConsole = 'Go to Alexa Developer Console';
    const link = SKILL_ACTION_URLS.SIMULATOR(skillId, locale);
    void vscode.window.showInformationMessage('This extension does not support interacting with the Alexa Presentation Language. ', goToConsole)
        .then(selection => {
            if (selection === goToConsole) {
                void vscode.env.openExternal(vscode.Uri.parse(link));
            }
        });
}
