/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-undef */
const vscode = acquireVsCodeApi();

window.onload = function(){
    document.getElementById("cloneSkill").onsubmit = function cloneSkill() {
        vscode.postMessage();
    };

    const skillLocaleNameTable = document.getElementById('skillLocaleNames');
    const tableBody = skillLocaleNameTable.tBodies[0];

    let localesInfoArray = document.getElementById('localeNameMap').value;
    localesInfoArray = JSON.parse(localesInfoArray.replace(/'/g,'"'));

    localesInfoArray.forEach(localeInfo => {
        const row = document.createElement('tr');

        const column1 = document.createElement('td');
        column1.appendChild(document.createTextNode(localeInfo[0]));
        row.appendChild(column1);

        const column2 = document.createElement('td');
        column2.appendChild(document.createTextNode(localeInfo[1]));
        row.appendChild(column2);

        tableBody.appendChild(row);
    });
};