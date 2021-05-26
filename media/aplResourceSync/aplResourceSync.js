/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-undef */
const vscode = acquireVsCodeApi();

window.onload = function () {
    retrieve();
    window.addEventListener('message', event => {
        const message = event.data;
        if (message.names) {
            const selectList = document.getElementById('name');
            selectList.innerHTML = '';
            message.names.forEach(name => {
                var option = document.createElement('option');
                option.value = name;
                option.text = name;
                selectList.appendChild(option);
            });
        }
    });

    document.getElementById('downloadApl').onsubmit = function downloadApl() {
        const name = document.getElementById('name').value;
        vscode.postMessage({
            action: 'sync',
            name: name,
        });
        return false;
    };
};

function retrieve() {
    vscode.postMessage({
        action: 'retrieve',
    });
}
