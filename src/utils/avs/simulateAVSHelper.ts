/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";
import * as simulateReplayHelper from "../../utils/simulateReplayHelper";
import {EXTENSION_STATE_KEY, SIMULATOR_MESSAGE_TYPE} from "../../constants";
import {Logger} from "../../logger";
import {readDeviceToken} from "./deviceTokenUtil";
import {AVSClient} from "./avsClient";

/**
 * Generate apeechCall AVS for the text utterances.
 */
export async function callAvsForRecognizeEvent(
  userInput: string,
  isNewSession: boolean,
  context: vscode.ExtensionContext,
): Promise<Record<string, any>> {
  Logger.verbose(`Calling method: simulateAVSHelper.callAvsForRecognizeEvent`);
  const token = await readDeviceToken(context);
  const region = await context.secrets.get(EXTENSION_STATE_KEY.REGISTERED_DEVICE.REGION);
  if (isNewSession) {
    await AVSClient.getInstance(token, context, region).sendNewSessionEvent();
  }
  const response = await AVSClient.getInstance(token, context).sendAudioEvent(userInput, isNewSession, context);
  return {
    invocationRequests: response.debugging.request,
    invocationResponses: response.debugging.response,
    alexaExecutionInfo: response.debugging.intent,
    alexaResponse: response.alexaResponse,
    documents: response.documents,
    dataSources: response.dataSources,
    viewport: JSON.stringify(simulateReplayHelper.aplViewport),
    viewportName: JSON.stringify(simulateReplayHelper.viewportName),
    type: SIMULATOR_MESSAGE_TYPE.UTTERANCE,
    aplCommands: response.aplCommands,
  };
}

/**
 * Call AVS with the user event callback when user click on the APL preview.
 * @param userEvent
 */
export async function callAvsForAplUserEvent(
  userEvent: Record<string, any>,
  context: vscode.ExtensionContext,
): Promise<Record<string, any>> {
  Logger.verbose(`Calling method: simulateAVSHelper.callAvsForAplUserEvent`);
  const token = await readDeviceToken(context);
  const region = await context.secrets.get(EXTENSION_STATE_KEY.REGISTERED_DEVICE.REGION);
  const response = await AVSClient.getInstance(token, context, region).sendUserEvent(userEvent);
  return {
    invocationRequests: "",
    invocationResponses: "",
    alexaExecutionInfo: "",
    alexaResponse: response.alexaResponse,
    documents: response.documents,
    dataSources: response.dataSources,
    viewport: JSON.stringify(simulateReplayHelper.aplViewport),
    viewportName: JSON.stringify(simulateReplayHelper.viewportName),
    type: SIMULATOR_MESSAGE_TYPE.UTTERANCE,
    aplCommands: response.aplCommands,
  };
}
