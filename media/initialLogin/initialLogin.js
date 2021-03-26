/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
const vscode = acquireVsCodeApi();

window.onload = function(){
    document.getElementById("signIn").onsubmit = function signIn() {
        document.getElementById("signInButton").disabled = true;
        vscode.postMessage();
    };
};