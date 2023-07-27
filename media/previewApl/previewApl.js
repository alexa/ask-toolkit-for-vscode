/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/

// load separate js file by vscode and renderer init sometimes has race condition
let renderer;
const vscode = acquireVsCodeApi();
const EMPTY_STRING = "";

window.onload = function () {
  initialize();
};

window.addEventListener("message", (event) => {
  const message = event.data; // The json data that the extension sent
  const sendCommandEvent = (commandEvent) => {};
  loadAplDoc(renderer, message.document, message.datasources, JSON.parse(message.viewport), message?.mode,EMPTY_STRING, sendCommandEvent);
});

function initialize() {
  // init renderer engine
  AplRenderer.initEngine().then(() => {
    vscode.postMessage({});
  });
}
