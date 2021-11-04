/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import HttpsProxyAgent from "https-proxy-agent";
import os from "os";
import {join} from "path";
import {AccessToken, create, OAuthClient} from "simple-oauth2";
import {resolver} from "./configuration";
import {AUTH} from "./constants";
import {getProperty, readFile} from "./jsonRead";
import {writeToProperty} from "./jsonUtility";
import {createConfigFileIfNotExists} from "./profileHelper";
import {isNonBlankString} from "./stringUtils";

export function createOAuth(
  clientId: string | undefined,
  clientSecret: string | undefined,
  lwaAuthorizeHost: string | undefined,
  lwaTokenHost: string | undefined,
): OAuthClient {
  // Set default CLI LWA value
  const id: string = resolver([clientId, process.env.ASK_LWA_CLIENT_ID, AUTH.DEFAULT_CLIENT_ID]);
  const secret: string = resolver([clientSecret, process.env.ASK_LWA_CLIENT_CONFIRMATION, AUTH.DEFAULT_CLIENT_CONFIRMATION]);
  const authorizeHost = resolver([lwaAuthorizeHost, process.env.ASK_LWA_AUTHORIZE_HOST, AUTH.DEFAULT_LWA_AUTHORIZE_HOST]);
  const authorizePath = "/ap/oa";
  const tokenHost = resolver([lwaTokenHost, process.env.ASK_LWA_TOKEN_HOST, AUTH.DEFAULT_ASK_LWA_TOKEN_HOST]);
  const tokenPath = "/auth/o2/token";
  const proxyUrl: string | undefined = process.env.ASK_CLI_PROXY;
  return create({
    client: {id, secret},
    auth: {authorizeHost, authorizePath, tokenHost, tokenPath},
    http: {agent: isNonBlankString(proxyUrl) ? new HttpsProxyAgent(proxyUrl as string) : null},
  });
}

export function isTokenExpired(
  profile: string,
  clientId?: string,
  clientSecret?: string,
  lwaAuthorizeHost?: string,
  lwaTokenHost?: string,
): boolean {
  const OAuth: OAuthClient = module.exports.createOAuth(clientId, clientSecret, lwaAuthorizeHost, lwaTokenHost);
  const storedToken: StoredToken | undefined = readToken(profile);
  if (!storedToken) {
    return true;
  }
  const token: AccessToken = OAuth.accessToken.create(readToken(profile) as StoredToken);
  return token.expired();
}

export function readToken(profile: string): StoredToken | undefined {
  if (profile === AUTH.PLACEHOLDER_ENVIRONMENT_VAR_PROFILE_NAME) {
    return {
      access_token: "ACCESS_TOKEN_PLACE_HOLDER",
      refresh_token: process.env.ASK_REFRESH_TOKEN as string,
      token_type: "bearer",
      expires_in: 0,
      expires_at: 0,
    };
  }
  const cliConfig: any = readFile(join(os.homedir(), ".ask", "cli_config"));
  if (!cliConfig) {
    return;
  }
  const token: any = getProperty(cliConfig, ".profiles." + profile + ".token");
  if (!token) {
    return;
  }
  return {
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    token_type: token.token_type,
    expires_in: token.expires_in,
    expires_at: token.expires_at,
  };
}

export function writeToken(token: any, profile: string): void {
  createConfigFileIfNotExists();
  const configPath = join(os.homedir(), ".ask", "cli_config");
  const configToken = {
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    token_type: token.token_type,
    expires_in: token.expires_in,
    expires_at: token.expires_at,
  };
  const propertyPathArray = ["profiles", profile, "token"];
  writeToProperty(configPath, propertyPathArray, configToken);
}

export async function refreshToken(
  profile: string,
  clientId?: string,
  clientSecret?: string,
  lwaAuthorizeHost?: string,
  lwaTokenHost?: string,
): Promise<string | undefined | void> {
  const OAuth: OAuthClient = module.exports.createOAuth(clientId, clientSecret, lwaAuthorizeHost, lwaTokenHost);
  const oldToken: StoredToken | undefined = readToken(profile);
  if (!oldToken) {
    return;
  }
  const token: AccessToken = OAuth.accessToken.create(oldToken);
  try {
    const refreshResult = await token.refresh();
    writeToken(refreshResult.token, profile);
    return getProperty(refreshResult, ".token.access_token");
  } catch (err) {
    throw new Error(`Failed to refresh access token: ${err}`);
  }
}

export interface StoredToken {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at: string | number;
}
