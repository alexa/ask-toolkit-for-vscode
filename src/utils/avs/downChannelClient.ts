/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/

import http2 = require("http2");
import retry = require("async-retry");
import {logAskError} from "../../exceptions";
import {Logger} from "../../logger";
import {getDirectiveIdentifier, parseJsonContent} from "./avsClientUtil";
import {IDirective, ISkillDebuggerContent, ISkillDebuggerPayload} from "./avsInterface";
import {AVS_CONFIG, AVS_CONSTANTS, IDENTIFIER, SIMPLE_AVS_BOUNDARY} from "./avsPayload";
import httpMessageParser = require("http-message-parser");

//Store the chunks received from downchannel.
let downchannelBuffer;

export class DownchannelManager {
  private accessToken: string;
  private clientSession: http2.ClientHttp2Session;
  private invocationRequestBodies: Array<Record<string, any>> = [];
  private invocationResponseBodies: Array<Record<string, any>> = [];
  private alexaExecutionInfo;
  private isOutOfSkillResponse = false;

  constructor(token: string, region = "NA") {
    Logger.verbose(`Calling method: DownchannelManager.constructor`);
    this.accessToken = token;
    this.clientSession = http2.connect(AVS_CONFIG.REGION[region]);
  }

  private processDcDirectives(data) {
    Logger.verbose(`Calling method: DownchannelManager.processDcDirectives`);
    this.invocationRequestBodies = [];
    this.invocationResponseBodies = [];
    if (data.multipart !== null && data.multipart.length > 0) {
      for (const part of data.multipart) {
        if (part.headers !== null) {
          if (part.headers["Content-Type"].indexOf("application/json") === 0) {
            this.parseResponseJson(part);
          } else {
            Logger.debug("This header is ignored:", part.headers);
          }
        }
      }
    }
    return {
      request: this.invocationRequestBodies,
      response: this.invocationResponseBodies,
      intent: this.alexaExecutionInfo,
    };
  }

  private parseResponseJson(part) {
    Logger.verbose(`Calling method: DownchannelManager.parseResponseJson`);
    const jsonContent: IDirective = parseJsonContent(part.body);
    if (jsonContent === undefined) {
      return;
    }
    const identifier = getDirectiveIdentifier(jsonContent);
    switch (identifier) {
      case IDENTIFIER.DEBUGGING_INFO:
        this.handleDebuggingInfoIdentifier(jsonContent);
        break;
      case IDENTIFIER.DEBUGGING_EXCEPTION: {
        const payload = jsonContent.payload;
        if (payload["code"] === AVS_CONSTANTS.UNAUTHORIZED_DEBUGGING_INFO_ACCESS) {
          this.isOutOfSkillResponse = true;
        }
        break;
      }
      default:
        Logger.debug("This identifier is missed to process:", identifier);
    }
  }

  /**
   * Send a request to avs downchannel.
   */
  connectDownChannel() {
    Logger.verbose(`Calling method: DownchannelManager.connectDownChannel`);
    const req = this.clientSession.request({
      ":method": "GET",
      ":path": `${AVS_CONFIG.ENDPOINT_VERSION}/directives`,
      authorization: `Bearer ${this.accessToken}`,
      "content-type": `multipart/form-data; boundary=${SIMPLE_AVS_BOUNDARY}`,
    });
    req.on("response", (headers, flags) => {
      req
        .on("data", (chunk) => {
          downchannelBuffer = downchannelBuffer ? Buffer.concat([downchannelBuffer, chunk]) : chunk;
        })
        .on("end", () => {
          Logger.debug("Downchannel closed.");
        });
    });
    req.on("error", function (err) {
      Logger.debug("Downchannel error: ", err);
    });
    req.end();
  }

  async getDcDirectives() {
    Logger.verbose(`Calling method: DownchannelManager.getDcDirectives`);
    const RETRY_OPTION: retry.Options = {
      retries: 10,
      minTimeout: 1000,
      factor: 1.1,
    };
    let downchannelDirectives;
    await retry(async (bail: (err: Error) => void, attempt: number): Promise<void> => {
      const parsedData = await httpMessageParser(downchannelBuffer);
      downchannelDirectives = this.processDcDirectives(parsedData);
      if (
        attempt < 10 &&
        this.isOutOfSkillResponse === false &&
        (downchannelDirectives.request.length < 1 || downchannelDirectives.response.length < 1)
      ) {
        throw logAskError(`Failed to get debugging info from downchannel, retrying...`);
      }
    }, RETRY_OPTION);
    this.isOutOfSkillResponse = false;
    //Initialize downchannelBuffer.
    downchannelBuffer.fill(0);
    return downchannelDirectives;
  }

  private handleDebuggingInfoIdentifier(jsonContent: IDirective) {
    const payload: ISkillDebuggerPayload = jsonContent.payload;
    const type = payload.type;
    if (type === AVS_CONSTANTS.DEBUGGING_INFO_TYPE.CONSIDERED_INTENTS && payload.content["intents"] !== null) {
      this.alexaExecutionInfo = payload.content["intents"];
    }
    if (type === AVS_CONSTANTS.DEBUGGING_INFO_TYPE.SKILL_EXECUTION_INFO) {
      const content: ISkillDebuggerContent = payload.content;
      if (content.invocationRequest !== null && content.invocationResponse !== null) {
        this.invocationRequestBodies = [content.invocationRequest.body];
        this.invocationResponseBodies = [content.invocationResponse.body];
      }
    }
  }
}
