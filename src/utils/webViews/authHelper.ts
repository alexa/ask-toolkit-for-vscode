/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import {Token} from "simple-oauth2";
import {EventEmitter, ExtensionContext} from "vscode";
import {AbstractWebView, PluginTreeItem, Resource, Utils} from "../../runtime";
import {onSkillConsoleViewChangeEventEmitter} from "../../askContainer/events";
import {Logger} from "../../logger";
import {DEFAULT_PROFILE, EXTENSION_STATE_KEY} from "../../constants";
import {AskParameterAbsenceError} from "../../exceptions";
import {ViewLoader} from "./viewLoader";
import {clearCachedSkills} from "../skillHelper";

export async function authenticate(
  context: ExtensionContext,
  webview?: AbstractWebView,
  profileName?: string,
  eventEmitter?: EventEmitter<PluginTreeItem<Resource>>,
): Promise<void> {
  Logger.debug(`Calling method: authenticate, args: `, profileName);
  const profile = profileName ?? DEFAULT_PROFILE;

  if (webview && !webview.isDisposed()) {
    const loader = new ViewLoader(context, "profileManager", webview);
    webview.getPanel().webview.html = loader.renderView({
      name: "initiateAuthFlow",
      js: false,
    });
  }
  const token: Token = await Utils.accessTokenGenerator({});
  Utils.deleteProfile(profile);
  Utils.writeToken(token, profile);
  const hasVendorId = await Utils.setVendorId(profile, context);
  if (!hasVendorId) {
    Utils.deleteProfile(profile);
    throw new AskParameterAbsenceError("No Vendor Id.");
  }
  context.globalState.update("LwaProfile", profile);
  context.globalState.update("didFirstTimeLogin", true);
  clearCachedSkills(context);
  onSkillConsoleViewChangeEventEmitter.fire(undefined);
}
