/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/

const vscode = acquireVsCodeApi();
const DEVICE_MESSAGE_TYPE = {
  USER_CODE: "userCode",
  ERROR_MESSAGE: "errorMessage",
  PRODUCT_INFO: "productInfo",
  DEVICE_INFO: "deviceInfo",
};
const ERROR_MESSAGE = {
  CLIENT_SECRET_ERROR: "Client secret error",
  CLIENT_ID_ERROR: "Client ID error",
};
const ID = {
  CLIENT_ID: "clientId",
  CLIENT_SECRET: "clientSecret",
};
const STYLE = {
  ERROR_BORDER: "1px solid #CC0C39",
  ERROR_COLOR: "#CC0C39",
  NORMAL_BORDER: "1px solid #ced4da",
  NORMAL_COLOR: "#495057",
};

window.onload = function () {
  const startRegistry = document.getElementById("productForm");
  startRegistry.onsubmit = registerDevice;
  // Handle message received from extension
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  window.addEventListener("message", async (event) => {
    const message = event.data;
    if (message.type === DEVICE_MESSAGE_TYPE.USER_CODE) {
      recoverNormalInput(ID.CLIENT_ID);
      recoverNormalInput(ID.CLIENT_SECRET);
      const expiredTime = getExpiredTime(message.response.expires_in);
      //Store the variables in VSC state and use it in page 'deviceRegistryInProgress'.
      const state = vscode.getState() || {};
      state["userCode"] = message.response.user_code;
      state["expiredTime"] = expiredTime;
      state["externalLink"] = message.response.verification_uri;
      await new Promise(() => vscode.setState(state));
    } else if (message.type === DEVICE_MESSAGE_TYPE.ERROR_MESSAGE) {
      const errorMessage = message.information.toString();
      if (errorMessage === ERROR_MESSAGE.CLIENT_ID_ERROR) {
        showErrorInput(ID.CLIENT_ID);
      } else if (errorMessage === ERROR_MESSAGE.CLIENT_SECRET_ERROR) {
        showErrorInput(ID.CLIENT_SECRET);
      }
      document.getElementById("submitBtn").disabled = false;
    } else if (message.type === DEVICE_MESSAGE_TYPE.PRODUCT_INFO) {
      document.getElementById("productId").value = message.productID;
      document.getElementById("clientId").value = message.clientID;
      document.getElementById("clientSecret").value = message.clientSecret;
      document.getElementById("region").value = message.region;
    }
  });
};

function registerDevice() {
  document.getElementById("submitBtn").disabled = true;
  const productId = document.getElementById("productId").value;
  const clientId = document.getElementById("clientId").value;
  const clientSecret = document.getElementById("clientSecret").value;
  const region = document.getElementById("region").value;

  if (isNonEmptyString(productId) && isNonEmptyString(clientId) && isNonEmptyString(clientSecret)) {
    infoCheckText.innerText = "";
    vscode.postMessage({
      productId,
      clientId,
      clientSecret,
      region,
      type: DEVICE_MESSAGE_TYPE.DEVICE_INFO,
    });
  } else {
    infoCheckText.innerText = "All fields are required.";
    document.getElementById("submitBtn").disabled = false;
  }
  const state = vscode.getState() || {};
  state["productId"] = productId;
  vscode.setState(state);
  return false;
}

function isNonEmptyString(str) {
  return str !== undefined && str !== "";
}

function getExpiredTime(expiresTime) {
  const datetime = new Date();
  datetime.setSeconds(datetime.getSeconds() + expiresTime);
  const hour = datetime.getHours();
  const minute = datetime.getMinutes();
  const expiredTime = (hour > 9 ? hour.toString() : `0${hour}`) + ":" + (minute > 9 ? minute.toString() : `0${minute}`);
  return expiredTime;
}

function showErrorInput(id) {
  document.getElementById(id).style.border = STYLE.ERROR_BORDER;
  document.getElementById(id).style.color = STYLE.ERROR_COLOR;
}

function recoverNormalInput(id) {
  document.getElementById(id).style.border = STYLE.NORMAL_BORDER;
  document.getElementById(id).style.color = STYLE.NORMAL_COLOR;
}
