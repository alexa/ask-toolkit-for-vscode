/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/

import axios from "axios";
import * as querystring from "querystring";
import {isEmpty} from "ramda";
import * as vscode from "vscode";
import {EXTENSION_STATE_KEY} from "../../constants";
import {logAskError} from "../../exceptions";
import {Logger} from "../../logger";

export async function getRegisteredDeviceId(context: vscode.ExtensionContext): Promise<string | undefined> {
  Logger.verbose(`Calling method: deviceTokenUtil.getRegisteredDeviceId`);
  return context.secrets.get(EXTENSION_STATE_KEY.REGISTERED_DEVICE.PRODUCT_ID);
}

export async function deleteRegisteredDevice(productId: string, context: vscode.ExtensionContext): Promise<void> {
  Logger.verbose(`Calling method: deviceTokenUtil.deleteRegisteredDevice`);
  // Currently not checking device id, since we only allow single device registration

  // Clear the registered LWA credentials for the device
  void context.secrets.delete(EXTENSION_STATE_KEY.REGISTERED_DEVICE.TOKEN.ACCESS_TOKEN);
  void context.secrets.delete(EXTENSION_STATE_KEY.REGISTERED_DEVICE.TOKEN.REFRESH_TOKEN);
  void context.secrets.delete(EXTENSION_STATE_KEY.REGISTERED_DEVICE.TOKEN.TOKEN_TYPE);
  void context.secrets.delete(EXTENSION_STATE_KEY.REGISTERED_DEVICE.TOKEN.EXPIRES_IN);
  void context.secrets.delete(EXTENSION_STATE_KEY.REGISTERED_DEVICE.TOKEN.EXPIRES_AT);

  // Clear the registered device details
  void context.secrets.delete(EXTENSION_STATE_KEY.REGISTERED_DEVICE.PRODUCT_ID);
  void context.secrets.delete(EXTENSION_STATE_KEY.REGISTERED_DEVICE.CLIENT_ID);
  void context.secrets.delete(EXTENSION_STATE_KEY.REGISTERED_DEVICE.CLIENT_SECRET);
  void context.secrets.delete(EXTENSION_STATE_KEY.REGISTERED_DEVICE.REGION);

  // Set valid device boolean as false
  await context.secrets.store(EXTENSION_STATE_KEY.REGISTERED_DEVICE.VALID_DEVICE, "false");

  //Clear the device valid time
  void context.globalState.update(EXTENSION_STATE_KEY.REGISTERED_DEVICE.DEVICE_EXPIRY_TIME, undefined);
}

export function storeDeviceInfoGlobalState(
  productID: string,
  clientID: string,
  clientSecret: string,
  region: string,
  context: vscode.ExtensionContext,
) {
  Logger.verbose(`Calling method: deviceTokenUtil.storeDeviceInfoGlobalState`);
  void context.secrets.store(EXTENSION_STATE_KEY.REGISTERED_DEVICE.PRODUCT_ID, productID);
  void context.secrets.store(EXTENSION_STATE_KEY.REGISTERED_DEVICE.CLIENT_ID, clientID);
  void context.secrets.store(EXTENSION_STATE_KEY.REGISTERED_DEVICE.CLIENT_SECRET, clientSecret);
  void context.secrets.store(EXTENSION_STATE_KEY.REGISTERED_DEVICE.REGION, region);
}

export function writeTokenToGlobalState(response, context: vscode.ExtensionContext): void {
  Logger.verbose(`Calling method: deviceTokenUtil.writeTokenToGlobalState`);
  const expireTime = getExpiredTime(response.data.expires_in);
  void context.secrets.store(EXTENSION_STATE_KEY.REGISTERED_DEVICE.TOKEN.ACCESS_TOKEN, response.data.access_token);
  void context.secrets.store(EXTENSION_STATE_KEY.REGISTERED_DEVICE.TOKEN.REFRESH_TOKEN, response.data.refresh_token);
  void context.secrets.store(EXTENSION_STATE_KEY.REGISTERED_DEVICE.TOKEN.TOKEN_TYPE, response.data.token_type);
  void context.secrets.store(EXTENSION_STATE_KEY.REGISTERED_DEVICE.TOKEN.EXPIRES_IN, response.data.expires_in);
  void context.secrets.store(EXTENSION_STATE_KEY.REGISTERED_DEVICE.TOKEN.EXPIRES_AT, expireTime);
}

export async function refreshDeviceToken(context: vscode.ExtensionContext): Promise<string> {
  Logger.verbose(`Calling method: deviceTokenUtil.refreshDeviceToken`);
  const refreshToken: string | undefined = await context.secrets.get(EXTENSION_STATE_KEY.REGISTERED_DEVICE.TOKEN.REFRESH_TOKEN);
  if (isEmpty(refreshToken)) {
    return "";
  }
  const clientID: string | undefined = await context.secrets.get(EXTENSION_STATE_KEY.REGISTERED_DEVICE.CLIENT_ID);
  const clientSecret: string | undefined = await context.secrets.get(EXTENSION_STATE_KEY.REGISTERED_DEVICE.CLIENT_SECRET);
  const requestBody = {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientID,
    client_secret: clientSecret,
  };
  let accessToken: string;
  try {
    const response = await axios.post(`https://api.amazon.com/auth/o2/token`, querystring.stringify(requestBody), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
    });
    writeTokenToGlobalState(response, context);
    accessToken = response.data.access_token;
  } catch (err) {
    throw logAskError(`Failed to refresh device token`, err);
  }
  return accessToken;
}

export function getExpiredTime(expiresIn: number) {
  Logger.verbose(`Calling method: deviceTokenUtil.getExpiredTime`);
  const datetime = new Date();
  datetime.setSeconds(datetime.getSeconds() + expiresIn);
  return datetime.toISOString();
}

export function isExpiredToken(context: vscode.ExtensionContext): boolean {
  Logger.verbose(`Calling method: deviceTokenUtil.isExpiredToken`);
  const currentTime = new Date().toISOString();
  const expiresTime: any = context.globalState.get(EXTENSION_STATE_KEY.REGISTERED_DEVICE.TOKEN.EXPIRES_AT);
  return Date.parse(currentTime) >= Date.parse(expiresTime) ? true : false;
}

export async function readDeviceToken(context: vscode.ExtensionContext): Promise<string> {
  Logger.verbose(`Calling method: deviceTokenUtil.readDeviceToken`);
  let accessToken;
  if (isExpiredToken(context)) {
    accessToken = await refreshDeviceToken(context);
  } else {
    accessToken = context.globalState.get(EXTENSION_STATE_KEY.REGISTERED_DEVICE.TOKEN.ACCESS_TOKEN);
  }
  return accessToken;
}
