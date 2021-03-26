/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-undef */
const vscode = acquireVsCodeApi();

window.onload = function(){
    document.getElementById("syncManifest").onsubmit = function syncManifest() {
        vscode.postMessage({});
    };
};