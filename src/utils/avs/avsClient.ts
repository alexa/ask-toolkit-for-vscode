/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/

import axios from "axios";
import {play} from "sound-play";
import {fileSync} from "tmp";
import * as vscode from "vscode";
import {logAskError} from "../../exceptions";
import {Logger} from "../../logger";
import {convertSpeechFormat, generateRequestSpeech, getDirectiveIdentifier, parseCaptionContent, parseJsonContent} from "./avsClientUtil";
import {IAplDocumentPayload, IDirective, IExecuteCommandsPayload, ISpeakPayload} from "./avsInterface";
import {
  AVS_CONFIG,
  AVS_CONSTANTS,
  AVS_EVENT_TYPE,
  CAPABILITY_PAYLOAD,
  createLocaleUpdateEventPayload,
  createNewSessionEventPayload,
  createRecognizeEventPayload,
  createUserEventPayload,
  IDENTIFIER,
  SIMPLE_AVS_BOUNDARY,
} from "./avsPayload";
import {DownchannelManager} from "./downChannelClient";
import http2 = require("http2");
import fs = require("fs");
import retry = require("async-retry");
import httpMessageParser = require("http-message-parser");

const RETRY_OPTION: retry.Options = {
  retries: 5,
  minTimeout: 1000,
  factor: 1.1,
};

let textResponse: string[] = [];
export let aplDocumentAvsMode: string | undefined;
export let aplDatasourceAvsMode: string | undefined;
let aplCommands;
let currentPresentationToken = "";
let debuggingDirectives = null;
//speechToken is the key to keep the session consistent.
let speechToken = "";
const audioResponsePostfix = ".mp3";
const audioResponseFilePermissions = "0600";

/**
 * AVS client is in charge of sending events to AVS and get directives from AVS, then parse directives to get the response.
 * Details: https://developer.amazon.com/en-US/docs/alexa/alexa-voice-service/structure-http2-request.html
 */
export class AVSClient {
  private accessToken: string;
  private clientSession: http2.ClientHttp2Session;
  private static instance: AVSClient;
  private region;

  constructor(token: string, context: vscode.ExtensionContext, region?: string) {
    this.accessToken = token;
    this.region = region;
    this.clientSession = http2.connect(AVS_CONFIG.REGION[this.region]);
    this.startPing;
  }

  public static getInstance(token: string, context: vscode.ExtensionContext, region?: string): AVSClient {
    Logger.verbose(`Calling method: AVSClient.getInstance`);
    if (!this.instance) {
      this.instance = new AVSClient(token, context, region);
    }
    return this.instance;
  }

  /**
   * To create payload for text event, then call AVS API to get resposne.
   * @param utterance
   * @param isNewSession
   */
  async sendAudioEvent(utterance: string, isNewSession: boolean, context: vscode.ExtensionContext): Promise<Record<string, any>> {
    Logger.verbose(`Calling method: AVSClient.sendAudioEvent`);
    if (isNewSession) {
      //Initialize speechToken for new session.
      speechToken = "";
    }
    await this.sendCapabilities();
    const recognizeEvent = createRecognizeEventPayload(speechToken);
    const inputSpeech = await generateRequestSpeech(utterance, context);
    convertSpeechFormat(inputSpeech);

    const audio = fs.readFileSync(inputSpeech);
    let data = recognizeEvent;
    data += AVS_CONSTANTS.CONTENT_DISPOSITION;
    data += AVS_CONSTANTS.CONTENT_TYPE;
    const payload = Buffer.concat([Buffer.from(data, "utf8"), audio, Buffer.from("\r\n--simple-avs-message-boundary\r\n", "utf8")]);
    const downchannel = new DownchannelManager(this.accessToken, this.region);
    downchannel.connectDownChannel();
    try {
      await this.sendEventToAVSRetries(payload, AVS_EVENT_TYPE.RECOGNIZE);
    } catch (err) {
      throw logAskError(`Failed to send recognize event, with error:`, err);
    }

    debuggingDirectives = await downchannel.getDcDirectives();
    return {
      alexaResponse: textResponse,
      documents: aplDocumentAvsMode,
      dataSources: aplDatasourceAvsMode,
      debugging: debuggingDirectives,
      aplCommands,
    };
  }

  /**
   * To create payload for APL press/click event, then call AVS API to get resposne.
   * @param userEvent
   */
  async sendUserEvent(userEvent: Record<string, string>): Promise<Record<string, any>> {
    Logger.verbose(`Calling method: AVSClient.sendUserEvent`);
    const body = createUserEventPayload(userEvent, currentPresentationToken);
    const payload = Buffer.from(body, "utf8");
    try {
      await this.sendEventToAVSRetries(payload, AVS_EVENT_TYPE.USEREVENT);
    } catch (err) {
      throw logAskError(`Failed to send user event, with error:`, err);
    }
    return {
      alexaResponse: textResponse,
      documents: aplDocumentAvsMode,
      dataSources: aplDatasourceAvsMode,
      debugging: debuggingDirectives,
      aplCommands,
    };
  }

  /**
   * Set up new session when user open simulator or reset session.
   */
  async sendNewSessionEvent(): Promise<void> {
    Logger.verbose(`Calling method: AVSClient.sendNewSessionEvent`);
    const body = createNewSessionEventPayload();
    const payload = Buffer.from(body, "utf8");
    try {
      await this.sendEventToAVSRetries(payload, AVS_EVENT_TYPE.FORCE_NEW_SESSION);
      Logger.verbose(`Start a new session.`);
    } catch (err) {
      throw logAskError(`Failed to send SynchronizeState event to start new session, with error:`, err);
    }
  }

  /**
   * Set up locale when user open simulator or change locales.
   * @param locale
   */
  async sendLocaleSettingEvent(locale: string): Promise<void> {
    Logger.verbose(`Calling method: AVSClient.sendLocaleSettingEvent`);
    const body = createLocaleUpdateEventPayload(locale);
    const payload = Buffer.from(body, "utf8");
    try {
      await this.sendEventToAVSRetries(payload, AVS_EVENT_TYPE.LOCALE);
      Logger.verbose(`Set locale to ${locale}.`);
    } catch (err) {
      throw logAskError(`Failed to send locale setting event, with error:`, err);
    }
  }

  /**
   * Play audio responses from AVS, in series
   * @param audioResponses Array of audio responses processed from AVS
   */
  private async playAudioResponses(audioResponses: any[]): Promise<void> {
    Logger.verbose(`Calling method: AVSClient.playAudioResponses`);
    for (const audioResponse of audioResponses) {
      await play(audioResponse);
    }
  }

  /**
   * Process the AVS response data to get multiple directives.
   * @param data
   */
  private async processAvsDirectives(data) {
    Logger.verbose(`Calling method: AVSClient.processAvsDirectives`);
    textResponse = [];
    aplDocumentAvsMode = undefined;
    aplDatasourceAvsMode = undefined;
    aplCommands = undefined;

    if (data.multipart !== null && data.multipart.length > 0) {
      const audioResponses: any[] = [];
      for (const part of data.multipart) {
        if (part.headers !== null) {
          if (part.headers["Content-Type"].indexOf("application/json") === 0) {
            await this.parseResponseJson(part);
          } else if (part.headers["Content-Type"].indexOf("application/octet-stream") === 0) {
            const audioResponse = this.parseResponseSpeechAudio(part);
            audioResponses.push(audioResponse);
          } else {
            Logger.debug("This header is ignored:", part.headers);
          }
        }
      }
      this.playAudioResponses(audioResponses);
    }
  }

  private async parseResponseJson(part) {
    Logger.verbose(`Calling method: AVSClient.parseResponseJson`);
    const jsonContent: IDirective = parseJsonContent(part.body);
    if (jsonContent === undefined) {
      return;
    }
    const identifier = getDirectiveIdentifier(jsonContent);
    switch (identifier) {
      case IDENTIFIER.SPEECHSYNTHESIZER_SPEAK:
        await this.handleSpeechSynthesizerSpeakIdentifier(jsonContent);
        break;
      case IDENTIFIER.APL_RENDERDOCUMENT:
        this.handleAplRenderDocumentIdentifier(jsonContent);
        break;
      case IDENTIFIER.APL_EXECUTE_COMMANDS:
        this.handleAplExecuteCommandsIdentifier(jsonContent);
        break;
      default:
        Logger.debug("This identifier is missed to process:", identifier);
    }
  }

  private parseResponseSpeechAudio(part): string {
    Logger.verbose(`Calling method: AVSClient.parseResponseSpeechAudio`);
    const audioResponseTmpObj = fileSync({postfix: audioResponsePostfix});
    fs.writeFileSync(audioResponseTmpObj.name, part.body, {mode: audioResponseFilePermissions});
    return audioResponseTmpObj.name;
  }

  //Retries for sending AVS requests
  private async sendEventToAVSRetries(body: Buffer, eventType: string) {
    Logger.verbose(`Calling method: AVSClient.sendEventToAVSRetries`);
    await retry(async (bail: (err: Error) => void, attempt: number): Promise<void> => {
      try {
        await this.sendEventToAVS(body, eventType);
      } catch (err) {
        throw logAskError(`Send ${eventType} failed, with error:`, err);
      }
    }, RETRY_OPTION);
  }

  /**
   * Send event to AVS, and receive buffer response.
   * @param body
   * @param eventType
   */
  private async sendEventToAVS(body: Buffer, eventType: string): Promise<void> {
    Logger.verbose(`Calling method: AVSClient.sendEventToAVS`);
    const req = this.clientSession.request({
      ":method": "POST",
      ":path": `${AVS_CONFIG.ENDPOINT_VERSION}/events`,
      authorization: `Bearer ${this.accessToken}`,
      "content-type": `multipart/form-data; boundary=${SIMPLE_AVS_BOUNDARY}`,
    });
    req.write(body);
    return new Promise((resolve, reject) => {
      req.on("response", (headers, flags) => {
        let data;
        req
          .on("data", (chunk) => {
            data = data ? Buffer.concat([data, chunk]) : chunk;
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
          })
          .on("end", async () => {
            if (eventType === AVS_EVENT_TYPE.RECOGNIZE || eventType === AVS_EVENT_TYPE.USEREVENT) {
              const parsedData = await httpMessageParser(data);
              await this.processAvsDirectives(parsedData);
            }
            resolve();
          });
      });
      req.on("error", function (err) {
        reject(err);
      });
      req.end();
    });
  }

  /**
   * Call capabilities API to update the capabilities of this device. The new capabilities is in CAPABILITY_PAYLOAD.
   */
  private async sendCapabilities() {
    Logger.verbose(`Calling method: AVSClient.sendCapabilities`);
    await retry(async (bail: (err: Error) => void, attempt: number): Promise<void> => {
      await axios
        .put(`${AVS_CONFIG.CAPABILITIES}`, JSON.stringify(CAPABILITY_PAYLOAD), {
          headers: {
            "x-amz-access-token": `${this.accessToken}`,
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
          Logger.verbose(`Succeed in sending capabilities.`);
          return;
        })
        .catch((error) => {
          throw logAskError(`Failed to send capabilities.`);
        });
    }, RETRY_OPTION);
  }

  /**
   * Send a ping every five mins to keep the client open.
   */
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  startPing = setInterval(async () => {
    await this.sendPing();
  }, 300000);

  async sendPing(): Promise<boolean> {
    const req = this.clientSession.request({
      ":method": "GET",
      ":path": `/ping`,
      authorization: `Bearer ${this.accessToken}`,
    });
    let isValid: boolean;
    return new Promise((resolve, reject) => {
      req.on("response", (headers, flags) => {
        if (headers[":status"] === 204) {
          isValid = true;
          Logger.verbose(`Succeed in sending ping.`);
        } else {
          Logger.verbose("Other status in PING:", headers[":status"]);
          this.clientSession.close();
          isValid = false;
        }
      });
      req.on("end", () => {
        resolve(isValid);
      });
      req.on("error", (err) => {
        this.clientSession.close();
        isValid = false;
        reject(err);
      });
      req.end();
    });
  }

  private async handleSpeechSynthesizerSpeakIdentifier(jsonContent: IDirective) {
    const payload: ISpeakPayload = jsonContent.payload;
    const caption = payload.caption;
    if (caption !== undefined) {
      if (typeof caption === "string") {
        textResponse.push(caption);
      } else if (typeof caption === "object" && caption.type === "WEBVTT") {
        const parsedCaptionContent = await parseCaptionContent(caption.content);
        textResponse.push(parsedCaptionContent);
      }
    }
    if (payload.token !== undefined) {
      speechToken = payload.token;
    }
  }
  private handleAplRenderDocumentIdentifier(jsonContent: IDirective) {
    const payload: IAplDocumentPayload = jsonContent.payload;
    aplDocumentAvsMode = payload.document === null ? undefined : JSON.stringify(payload.document);
    aplDatasourceAvsMode = payload.datasources === null ? undefined : JSON.stringify(payload.datasources);
    currentPresentationToken = payload.presentationToken;
  }
  private handleAplExecuteCommandsIdentifier(jsonContent: IDirective) {
    const payload: IExecuteCommandsPayload = jsonContent.payload;
    if (payload.presentationToken === currentPresentationToken) {
      aplCommands = payload.commands;
    } else {
      Logger.verbose("Dropping execute commands because of presentationToken mismatch");
    }
  }
}
