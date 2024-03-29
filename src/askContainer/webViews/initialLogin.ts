/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import * as vscode from "vscode";
import {DEFAULT_PROFILE, WEB_VIEW_NAME} from "../../constants";
import {AskParameterAbsenceError, logAskError} from "../../exceptions";
import {Logger} from "../../logger";
import {AbstractWebView} from "../../runtime";
import {authenticate} from "../../utils/webViews/authHelper";
import {ViewLoader} from "../../utils/webViews/viewLoader";
import {AUTH_FLOW_RESULT} from "./profileManagerWebview";

type SignInType = {
  profileName: string;
};

export class InitialLoginWebview extends AbstractWebView {
  private loader: ViewLoader;

  constructor(viewTitle: string, viewId: string, context: vscode.ExtensionContext) {
    super(viewTitle, viewId, context);
    this.loader = new ViewLoader(this.extensionContext, WEB_VIEW_NAME.INITIAL_LOGIN, this);
  }

  onViewChangeListener(event: vscode.WebviewPanelOnDidChangeViewStateEvent): void {
    Logger.debug(`Calling method: ${this.viewId}.getHtmlForView`);

    return;
  }

  onReceiveMessageListener(message: SignInType): void {
    Logger.debug(`Calling method: ${this.viewId}.onReceiveMessageListener, args:`, message);
    this.doAuthenticate();
  }

  getHtmlForView(...args: unknown[]): string {
    Logger.debug(`Calling method: ${this.viewId}.getHtmlForView`);
    return this.loader.renderView({
      name: WEB_VIEW_NAME.INITIAL_LOGIN,
      js: true,
    });
  }

  async doAuthenticate(): Promise<void> {
    Logger.debug(`Calling method: ${this.viewId}.doAuthenticate`);
    try {
      await authenticate(this.extensionContext, this, DEFAULT_PROFILE);
      void vscode.commands.executeCommand("workbench.action.reloadWindow");
    } catch (error) {
      Logger.error(error);
      let viewArgs;
      if (error instanceof AskParameterAbsenceError) {
        viewArgs = AUTH_FLOW_RESULT.VENDOR_ID_ABSENCE;
      } else {
        viewArgs = AUTH_FLOW_RESULT.FAILED;
        viewArgs.message = error instanceof Error ? error.message : error;
      }
      this.loader = new ViewLoader(this.extensionContext, "profileManager", this);
      if (!this.isDisposed()) {
        this.getPanel().webview.html = this.loader.renderView({
          name: "authFlowResult",
          args: viewArgs,
        });
      }
    }
  }

  reviveView(): void {
    Logger.debug(`Calling method: ${this.viewId}.reviveView`);
    throw logAskError("Method not implemented.");
  }
}
