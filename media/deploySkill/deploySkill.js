/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
const vscode = acquireVsCodeApi();

window.onload = function() {
    const deployBtn = document.getElementById('deployBtn');
    const noteDeployBtnActive = document.getElementById('noteBtnActive');
    const noteDeployBtnInactive = document.getElementById('noteBtnInactive');

    // Handle the message inside the webview
    window.addEventListener('message', event => {
        const message = event.data; // The JSON data our extension sent
        if (message.deploymentStatus !== undefined && message.deploymentStatus === 'done') {
            deployBtn.disabled = false;
            noteDeployBtnActive.style.display = 'inline';
            noteDeployBtnInactive.style.display = 'none';
        } else if (message.changesExist !== undefined) {
            if (message.changesExist) {
                deployBtn.disabled = false;
                noteDeployBtnActive.style.display = 'inline';
                noteDeployBtnInactive.style.display = 'none';
            } else {
                deployBtn.disabled = true;
                noteDeployBtnActive.style.display = 'none';
                noteDeployBtnInactive.style.display = 'inline';
            }
        }
    });

    document.getElementById("deploySkill").onsubmit = function deploySkill() {
        const deployBtn = document.getElementById('deployBtn');
        deployBtn.disabled = true;
    
        vscode.postMessage('deploySkill');
    };

    document.getElementById("refresh").onclick = function refresh() {
        vscode.postMessage('refresh');
    };
};