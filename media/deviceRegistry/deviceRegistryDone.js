/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/

const vscode = acquireVsCodeApi();
const DEVICE_MESSAGE_TYPE = {
  START_AVS_MODE: "startAvsMode",
  CANCEL_AVS_MODE: "cancelAvsMode",
  TO_FIRST_PAGE: "toFirstPage",
};
const CONSTANTS = {
  REMEMBER_DEVICE: "rememberDevice",
  CHECKED_TEXT: "checkedText",
  NO_CHECKED_TEXT: "notCheckedText",
};

window.onload = function () {
  yesBtn.onclick = openAvsMode;
  cancelBtn.onclick = cancelAvsMode;
  firstPage.onclick = backToFirstPage;
  rememberDevice.onclick = showPromptInfo;
  const previousState = vscode.getState();
  productId.innerText = previousState.productId;
  window.addEventListener("message", (event) => {});
};

function openAvsMode() {
  const isRememberDeviceChecked = document.getElementById(CONSTANTS.REMEMBER_DEVICE).checked;
  vscode.postMessage({
    type: DEVICE_MESSAGE_TYPE.START_AVS_MODE,
    isRememberDeviceChecked,
  });
}

function cancelAvsMode() {
  vscode.postMessage({
    type: DEVICE_MESSAGE_TYPE.CANCEL_AVS_MODE,
  });
}

function backToFirstPage() {
  vscode.postMessage({
    type: DEVICE_MESSAGE_TYPE.TO_FIRST_PAGE,
  });
}

function showPromptInfo() {
  if (document.getElementById(CONSTANTS.REMEMBER_DEVICE).checked) {
    document.getElementById(CONSTANTS.CHECKED_TEXT).style.display = "block";
    document.getElementById(CONSTANTS.NO_CHECKED_TEXT).style.display = "none";
  } else {
    document.getElementById(CONSTANTS.CHECKED_TEXT).style.display = "none";
    document.getElementById(CONSTANTS.NO_CHECKED_TEXT).style.display = "block";
  }
}
