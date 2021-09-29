/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/

import axios from 'axios';
import * as querystring from 'querystring';
import { v4 as uuid } from 'uuid';
import * as vscode from 'vscode';
import { logAskError } from '../../exceptions';
import { Logger } from '../../logger';
import { IDeviceCodeResponse } from './avsInterface';
import { AVS_CONFIG, AVS_CONSTANTS, AVS_ERROR_MESSAGE } from './avsPayload';
import { storeDeviceInfoGlobalState, writeTokenToGlobalState } from './deviceTokenUtil';

/**
 * CBL method to register device. Reference: https://developer.amazon.com/en-US/docs/alexa/alexa-voice-service/code-based-linking-other-platforms.html
 */
export async function sendDeviceAuthRequest(context: vscode.ExtensionContext, productID: string, clientID: string, clientSecret: string, region: string): Promise<IDeviceCodeResponse> {
    Logger.verbose(`Calling method: deviceToken.sendDeviceAuthRequest`);
    void storeDeviceInfoGlobalState(productID, clientID, clientSecret, region, context);
    const scopeData = {
        'alexa:all':
        {
            productID,
            productInstanceAttributes: {
                deviceSerialNumber: uuid().toString(),
            }
        }
    };
    const requestBody = {
        response_type: AVS_CONSTANTS.DEVICE_CODE,
        client_id: clientID,
        scope: AVS_CONSTANTS.ALEXA_ALL_SCOPE,
        scope_data: JSON.stringify(scopeData),
    };
    let deviceResponse: IDeviceCodeResponse;
    try {
        const response = await axios.post(AVS_CONFIG.AUTH_CODEPAIR, querystring.stringify(requestBody), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        });
        deviceResponse = response.data;
        return deviceResponse;
    } catch (err) {
        throw logAskError(AVS_ERROR_MESSAGE.GET_AUTH_CODE_FAILED, err);
    }
}

export async function getDeviceTokenWithCode(deviceCode: string, userCode: string, context: vscode.ExtensionContext): Promise<string | undefined> {
    Logger.verbose(`Calling method: deviceToken.getDeviceTokenWithCode`);
    const requestBody = {
        grant_type: AVS_CONSTANTS.DEVICE_CODE,
        device_code: deviceCode,
        user_code: userCode,
    };
    let accessToken: string;
    try {
        const response = await axios.post(AVS_CONFIG.AUTH_TOKEN, querystring.stringify(requestBody), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            }
        });
        writeTokenToGlobalState(response, context);
        accessToken = response.data.access_token;
        return accessToken;
    } catch (err) {
        throw logAskError(AVS_ERROR_MESSAGE.GET_DEVICE_TOKEN_FAILED, err);
    }
}