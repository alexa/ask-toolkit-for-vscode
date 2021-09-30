/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";
import {ERRORS, EXTENSION_STATE_KEY} from "../../constants";
import {logAskError} from "../../exceptions";
import {Logger} from "../../logger";
import {AbstractWebView} from "../../runtime";
import {AVSClient} from "../../utils/avs/avsClient";
import {IDeviceCodeResponse} from "../../utils/avs/avsInterface";
import {AVS_ERROR_MESSAGE} from "../../utils/avs/avsPayload";
import {getDeviceTokenWithCode, sendDeviceAuthRequest} from "../../utils/avs/deviceToken";
import {refreshDeviceToken} from "../../utils/avs/deviceTokenUtil";
import {ViewLoader} from "../../utils/webViews/viewLoader";
import {onDeviceRegistrationEventEmitter} from "../events";
import retry = require("async-retry");

const RECEIVE_MESSAGE_TYPE = {
  DEVICE_INFO: "deviceInfo",
  RETRY_USER_CODE: "retryForUserCode",
  TO_FIRST_PAGE: "toFirstPage",
  START_AVS_MODE: "startAvsMode",
  CANCEL_AVS_MODE: "cancelAvsMode",
};
const POST_MESSAGE_TYPE = {
  USER_CODE: "userCode",
  ERROR_MESSAGE: "errorMessage",
  RETRY: "retry",
  PRODUCT_INFO: "productInfo",
};
const PAGES = {
  DEVICE_REGISTRY: "deviceRegistry",
  DEVICE_REGISTRY_PROGRESS: "deviceRegistryInProgress",
  DEVICE_REGISTRY_DONE: "deviceRegistryDone",
};
const DEVICE_REGISTRY_ERRORS = {
  PING_AVS_FAILED: "Failed to ping AVS due to the incorrect accessToken.",
  GET_ACCESSTOKEN_FAILED: "Failed to get accessToken.",
  CLIENT_SECRET_ERROR: "Client secret error",
  CLIENT_ID_ERROR: "Client ID error",
  GET_AUTH_FAILED: "Failed to get authorization. Please go to the first page to check the product information.",
  WEBVIEW_DISPOSED: "Webview is disposed",
};
export const DEVICE_EXPIRY_TIME = {
  INDEFINITELY: "indefinitely",
};

let deviceInfo;
let deviceResponse: IDeviceCodeResponse;

export class DeviceRegistryWebview extends AbstractWebView {
  private loader: ViewLoader;
  private context: vscode.ExtensionContext;

  constructor(viewTitle: string, viewId: string, context: vscode.ExtensionContext) {
    super(viewTitle, viewId, context);
    this.loader = new ViewLoader(this.extensionContext, PAGES.DEVICE_REGISTRY, this);
    this.context = context;
    this.shouldPersist = true;
  }

  onViewChangeListener(): void {
    Logger.debug(`Calling method: ${this.viewId}.onViewChangeListener`);
    return;
  }

  getHtmlForView(): string {
    Logger.debug(`Calling method: ${this.viewId}.getHtmlForView`);
    return this.loader.renderView({
      name: PAGES.DEVICE_REGISTRY,
      js: true,
    });
  }

  async onReceiveMessageListener(message: any): Promise<void> {
    Logger.debug(`Calling method: ${this.viewId}.onReceiveMessageListener, args: `, message);
    switch (message.type) {
      case RECEIVE_MESSAGE_TYPE.DEVICE_INFO:
        deviceInfo = message;
        await this.getUserCodeForRegistry(PAGES.DEVICE_REGISTRY);
        break;
      case RECEIVE_MESSAGE_TYPE.RETRY_USER_CODE:
        await this.getUserCodeForRegistry(PAGES.DEVICE_REGISTRY_PROGRESS);
        break;
      case RECEIVE_MESSAGE_TYPE.TO_FIRST_PAGE:
        await this.backToFirstPage();
        break;
      case RECEIVE_MESSAGE_TYPE.START_AVS_MODE:
        void this.extensionContext.secrets.store(EXTENSION_STATE_KEY.REGISTERED_DEVICE.VALID_DEVICE, "true");
        await this.extensionContext.globalState.update(
          EXTENSION_STATE_KEY.REGISTERED_DEVICE.DEVICE_EXPIRY_TIME,
          this.getMaxExpiryTime(message.isRememberDeviceChecked),
        );
        this.getPanel().dispose();
        onDeviceRegistrationEventEmitter.fire(await this.extensionContext.secrets.get(EXTENSION_STATE_KEY.REGISTERED_DEVICE.PRODUCT_ID));
        break;
      case RECEIVE_MESSAGE_TYPE.CANCEL_AVS_MODE:
        this.getPanel().dispose();
        break;
      default:
        throw logAskError(ERRORS.UNRECOGNIZED_MESSAGE_FROM_WEBVIEW);
    }
  }

  /**
   * Retries for access token. Render 'deviceRegistryDone' page if success,
   * otherwise send out message to retry for the user_code.
   */
  private async startRegistryMonitor() {
    Logger.verbose(`Calling method: ${this.viewId}.startRegistryMonitor.`);
    try {
      await this.getAccessToken();
    } catch (err) {
      await this.getWebview().postMessage({
        information: `Code expired, click refresh button to get new code.`,
        type: POST_MESSAGE_TYPE.RETRY,
      });
    }
    //Refresh token will use the client secret, so call it here to check the correctness of the client secret.
    try {
      await refreshDeviceToken(this.context);
    } catch (err) {
      await this.backToFirstPage();
      throw logAskError(DEVICE_REGISTRY_ERRORS.CLIENT_SECRET_ERROR, err);
    }
    this.getPanel().webview.html = this.loader.renderView({
      name: PAGES.DEVICE_REGISTRY_DONE,
      js: true,
    });
  }

  /**
   * Retry every three seconds for nearly ten mins to get access token.
   */
  private async getAccessToken() {
    Logger.verbose(`Calling method: ${this.viewId}.getAccessToken.`);
    const RETRY_OPTION: retry.Options = {
      retries: 200,
      minTimeout: 3000,
      factor: 1.1,
    };
    await retry(async (bail: (err: Error) => void, attempt: number): Promise<void> => {
      try {
        const accessToken = await getDeviceTokenWithCode(deviceResponse.device_code, deviceResponse.user_code, this.extensionContext);
        if (accessToken !== undefined) {
          const region = await this.extensionContext.secrets.get(EXTENSION_STATE_KEY.REGISTERED_DEVICE.REGION);
          const isValidToken: boolean = await AVSClient.getInstance(accessToken, this.extensionContext, region).sendPing();
          if (!isValidToken) {
            throw logAskError(DEVICE_REGISTRY_ERRORS.PING_AVS_FAILED);
          }
        }
      } catch (err) {
        throw logAskError(DEVICE_REGISTRY_ERRORS.GET_ACCESSTOKEN_FAILED, err);
      }
    }, RETRY_OPTION);
  }

  /**
   * Call auth endpoint with the device info, switch to in_progress page.
   * if good to get the user_code, show message to user if not.
   * @param page
   */
  private async getUserCodeForRegistry(page: string) {
    Logger.verbose(`Calling method: ${this.viewId}.getUserCodeForRegistry.`);
    try {
      const authResponse: IDeviceCodeResponse = await sendDeviceAuthRequest(
        this.extensionContext,
        deviceInfo.productId,
        deviceInfo.clientId,
        deviceInfo.clientSecret,
        deviceInfo.region,
      );
      //Turn to page2 when get user_code, stay in page1 and show error prompt when failed to get user_code.
      deviceResponse = authResponse;
      await this.getWebview().postMessage({
        response: deviceResponse,
        type: POST_MESSAGE_TYPE.USER_CODE,
      });
      this.getPanel().webview.html = this.loader.renderView({
        name: PAGES.DEVICE_REGISTRY_PROGRESS,
        js: true,
      });
      await this.startRegistryMonitor();
    } catch (err) {
      if (err.message.startsWith(DEVICE_REGISTRY_ERRORS.CLIENT_SECRET_ERROR) === true) {
        await this.getWebview().postMessage({
          information: DEVICE_REGISTRY_ERRORS.CLIENT_SECRET_ERROR,
          type: POST_MESSAGE_TYPE.ERROR_MESSAGE,
        });
      } else if (err.message.includes(AVS_ERROR_MESSAGE.GET_AUTH_CODE_FAILED) === true) {
        await this.getWebview().postMessage({
          information: DEVICE_REGISTRY_ERRORS.CLIENT_ID_ERROR,
          type: POST_MESSAGE_TYPE.ERROR_MESSAGE,
        });
      } else if (err.message === DEVICE_REGISTRY_ERRORS.WEBVIEW_DISPOSED) {
        Logger.debug(err);
      } else {
        throw logAskError(DEVICE_REGISTRY_ERRORS.GET_AUTH_FAILED, err, true);
      }
    }
  }

  /**
   * Back to the first page under two situations: LWA error occurs or user click on progress bar to get back.
   */
  private async backToFirstPage() {
    Logger.verbose(`Calling method: ${this.viewId}.backToFirstPage.`);
    this.getPanel().webview.html = this.loader.renderView({
      name: PAGES.DEVICE_REGISTRY,
      js: true,
    });
    //reload the product info.
    const productID = await this.context.secrets.get(EXTENSION_STATE_KEY.REGISTERED_DEVICE.PRODUCT_ID);
    const clientID = await this.context.secrets.get(EXTENSION_STATE_KEY.REGISTERED_DEVICE.CLIENT_ID);
    const clientSecret = await this.context.secrets.get(EXTENSION_STATE_KEY.REGISTERED_DEVICE.CLIENT_SECRET);
    const region = await this.context.secrets.get(EXTENSION_STATE_KEY.REGISTERED_DEVICE.REGION);
    await this.getWebview().postMessage({
      productID,
      clientID,
      clientSecret,
      region,
      type: POST_MESSAGE_TYPE.PRODUCT_INFO,
    });
  }

  private getMaxExpiryTime(isRememberDeviceChecked: boolean) {
    Logger.verbose(`Calling method: ${this.viewId}.getMaxExpiryTime`);
    const maxExpiryTime = new Date();
    if (isRememberDeviceChecked === false) {
      maxExpiryTime.setDate(maxExpiryTime.getDate() + 7);
      return maxExpiryTime.toISOString();
    } else {
      return DEVICE_EXPIRY_TIME.INDEFINITELY;
    }
  }
}
