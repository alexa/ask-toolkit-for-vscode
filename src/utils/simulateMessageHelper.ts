/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/

import * as model from "ask-smapi-model";
import * as os from "os";
import * as vscode from "vscode";
import {
  EN_US_LOCALE,
  ERRORS,
  EXTENSION_STATE_KEY,
  SIMULATOR_MESSAGE_TYPE,
  SIMULATOR_WEBVIEW_MESSAGES,
  SKILL_ACTION_URLS,
} from "../constants";
import {logAskError} from "../exceptions";
import {Logger} from "../logger";
import {SmapiClientFactory} from "../runtime";
import {callAvsForRecognizeEvent} from "../utils/avs/simulateAVSHelper";
import {exportFileForReplay} from "../utils/simulateReplayHelper";
import * as simulateSkillHelper from "../utils/simulateSkillHelper";
import {getAvailableLocales} from "../utils/skillHelper";
import {AVSClient} from "./avs/avsClient";
import {readDeviceToken} from "./avs/deviceTokenUtil";

export let currentLocale: string = EN_US_LOCALE;
export let currentSkillId: string;
export let isSkillEnabled = false;

/**
 * Handle message sent from Webview when skill status is changed or check skill status
 * @param webviewMessage message sent from Webview
 * @param profile user profile
 * @param skillId Alexa Skill ID
 * @param context VSCode extension context
 */
export async function handleSkillStatusMessageFromWebview(
  webviewMessage: Record<string, any>,
  profile: string,
  skillId: string,
  context: vscode.ExtensionContext,
): Promise<string> {
  Logger.verbose(`Calling method: simulateMessageHelper.handleSkillStatusMessageFromWebview`);
  if (webviewMessage.message === SIMULATOR_WEBVIEW_MESSAGES.ENABLE_SKILL) {
    await simulateSkillHelper.enableSkill(profile, skillId, context);
    isSkillEnabled = true;
    return SIMULATOR_WEBVIEW_MESSAGES.ENABLED_SKILL;
  } else if (webviewMessage.message === SIMULATOR_WEBVIEW_MESSAGES.DISABLE_SKILL) {
    const skillEnabled = await simulateSkillHelper.checkSkillStatus(profile, skillId, context);
    if (skillEnabled) {
      await simulateSkillHelper.disableSkill(profile, skillId, context);
    }
    isSkillEnabled = false;
    return SIMULATOR_WEBVIEW_MESSAGES.DISABLED_SKILL;
  } else if (webviewMessage.message === SIMULATOR_WEBVIEW_MESSAGES.CHECK_SKILL_STATUS) {
    currentSkillId = skillId;
    const skillEnabled = await simulateSkillHelper.checkSkillStatus(profile, skillId, context);
    isSkillEnabled = skillEnabled;
    return skillEnabled ? SIMULATOR_WEBVIEW_MESSAGES.ENABLED_SKILL : SIMULATOR_WEBVIEW_MESSAGES.DISABLED_SKILL;
  } else {
    throw logAskError(ERRORS.UNRECOGNIZED_MESSAGE_FROM_WEBVIEW);
  }
}

/**
 * Handle message sent from Webview to check locales
 * @param webviewMessage message sent from Webview
 * @param profile user profile
 * @param skillId Alexa Skill ID
 * @param context VSCode extension context
 */
export async function handleLocaleMessageFromWebview(
  webviewMessage: Record<string, any>,
  profile: string,
  skillId: string,
  context: vscode.ExtensionContext,
  isAVSMode: boolean,
): Promise<void | Record<string, any>> {
  Logger.verbose(`Calling method: simulateMessageHelper.handleLocaleMessageFromWebview`);
  const region = await context.secrets.get(EXTENSION_STATE_KEY.REGISTERED_DEVICE.REGION);
  if (webviewMessage.message === SIMULATOR_WEBVIEW_MESSAGES.CHECK_AVAILABLE_LOCALES) {
    const availableLocales = await getAvailableLocales(profile, skillId, context);
    if (availableLocales.availableLocales.length < 1) {
      Logger.error(`Cannot find locales in this skill: `, skillId);
    }
    currentLocale = webviewMessage.currentLocale !== undefined ? webviewMessage.currentLocale : availableLocales.availableLocales[0];
    const invocationName = await getInvocationName(profile, skillId, context);
    if (isAVSMode) {
      const token = await readDeviceToken(context);
      await AVSClient.getInstance(token, context, region).sendLocaleSettingEvent(currentLocale);
    }
    return {
      locale: availableLocales,
      invocationName,
      type: SIMULATOR_MESSAGE_TYPE.LOCALE,
    };
  } else if (webviewMessage.message === SIMULATOR_WEBVIEW_MESSAGES.UPDATE_LOCALE) {
    currentLocale = webviewMessage.skillLocale;
    const invocationName = await getInvocationName(profile, skillId, context);
    if (isAVSMode) {
      const token = await readDeviceToken(context);
      await AVSClient.getInstance(token, context, region).sendLocaleSettingEvent(currentLocale);
    }
    return {
      invocationName,
      type: SIMULATOR_MESSAGE_TYPE.LOCALE,
    };
  } else {
    throw logAskError(ERRORS.UNRECOGNIZED_MESSAGE_FROM_WEBVIEW);
  }
}

/**
 * Handle message sent from Webview when user enters input into chat box
 * @param webviewMessage message sent from Webview
 * @param profile user profile
 * @param skillId Alexa Skill ID
 * @param context VSCode extension context
 */
export async function handleUtteranceMessageFromWebview(
  webviewMessage: Record<string, any>,
  profile: string,
  skillId: string,
  context: vscode.ExtensionContext,
  isAVSMode: boolean,
): Promise<void | Record<string, any>> {
  Logger.verbose(`Calling method: simulateMessageHelper.handleUtteranceMessageFromWebview`);
  const userInput: string = webviewMessage.userInput;
  const skillLocale: string = webviewMessage.skillLocale;
  const sessionMode: boolean = webviewMessage.sessionMode;
  try {
    let returnMessage;
    if (isAVSMode) {
      returnMessage = await callAvsForRecognizeEvent(userInput, sessionMode, context);
    } else {
      const simulationResult = await simulateSkillHelper.getSimulationResponse(
        userInput,
        skillLocale,
        sessionMode,
        profile,
        skillId,
        context,
      );
      returnMessage = simulateSkillHelper.formatAlexaResponse(simulationResult, skillId);
    }

    if (returnMessage.type !== SIMULATOR_MESSAGE_TYPE.UTTERANCE && returnMessage.type !== SIMULATOR_MESSAGE_TYPE.EXCEPTION) {
      throw logAskError(ERRORS.UNRECOGNIZED_SIMULATION_RETURN_MESSAGE);
    }
    return returnMessage;
  } catch (err) {
    throw logAskError(ERRORS.SIMULATION_REQUEST_FAIL, err, true);
  }
}

/**
 * Handle message sent from Webview when user click export button
 * @param webviewMessage message sent from Webview
 * @param skillId Alexa Skill ID
 * @param skillName
 */
export async function handleExportMessageFromWebview(
  webviewMessage: Record<string, any>,
  skillId: string,
  skillName: string,
  context: vscode.ExtensionContext,
): Promise<void> {
  Logger.verbose(`Calling method: simulateMessageHelper.handleExportMessageFromWebview`);
  await exportFileForReplay(webviewMessage, skillId, skillName, context);
}

/**
 * Handle message sent from Webview when user click preview div
 * @param webviewMessage message sent from Webview
 * @param skillId Alexa Skill ID
 */
export function handleActionMessageFromWebview(webviewMessage: Record<string, string>, skillId: string, isAVSMode: boolean): void {
  Logger.verbose(`Calling method: simulateMessageHelper.handleActionMessageFromWebview`);
  const platform = os.platform();
  //Show registry webview for windows and macOS when simulator in SMAPI mode and has APL document for preview.
  if (!isAVSMode && simulateSkillHelper.aplDocument !== undefined) {
    if (platform === "darwin" || platform === "win32") {
      const register = "Register device";
      void vscode.window
        .showInformationMessage(
          `APL touch interactions require creating an AVS virtual device. 
            [Learn more](https://developer.amazon.com/en-US/docs/alexa/ask-toolkit/vs-code-testing-simulator.html#register-device)`,
          register,
        )
        .then(async (selection) => {
          if (selection === register) {
            await vscode.commands.executeCommand("askContainer.skillsConsole.deviceRegistry");
          }
        });
    } else {
      let locale = webviewMessage.locale ? webviewMessage.locale : "en-US";
      locale = locale.replace("-", "_");
      const goToConsole = "Go to Alexa Developer Console";
      const link = SKILL_ACTION_URLS.SIMULATOR(skillId, locale);
      void vscode.window
        .showInformationMessage(
          "This extension supports interacting with the Alexa Presentation Language on MacOS and Windows only. For other platforms please go to the developer console. ",
          goToConsole,
        )
        .then((selection) => {
          if (selection === goToConsole) {
            void vscode.env.openExternal(vscode.Uri.parse(link));
          }
        });
    }
  }
}

/**
 * Call SMAPI to get the realtime invocation name.
 * @param profile
 * @param skillId
 * @param context
 */
export async function getInvocationName(profile: string, skillId: string, context: vscode.ExtensionContext) {
  Logger.verbose(`Calling method: simulateMessageHelper.getInvocationName`);
  try {
    const smapiClient = SmapiClientFactory.getInstance(profile, context);
    const interactionModelResponse: model.v1.skill.interactionModel.InteractionModelData = await smapiClient.getInteractionModelV1(
      skillId,
      "development",
      currentLocale,
    );
    const invocationName = "open " + interactionModelResponse.interactionModel?.languageModel?.invocationName?.toString();
    return invocationName;
  } catch (err) {
    if (err.statusCode === 404) {
      void vscode.window.showErrorMessage(`There is no interaction model for ${currentLocale}. Select a different locale.`);
    }
    throw logAskError("There was a problem downloading the interaction model. Try the download again.", err);
  }
}
