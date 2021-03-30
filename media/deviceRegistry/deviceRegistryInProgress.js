/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/

const vscode = acquireVsCodeApi();
const DEVICE_MESSAGE_TYPE = {
    USER_CODE: 'userCode',
    RETRY: 'retry',
    RETRY_USER_CODE: 'retryForUserCode',
    TO_FIRST_PAGE: 'toFirstPage'
};

window.onload = function () {
    //Read user_code
    const label = document.getElementById('userCode');
    const previousState = vscode.getState();
    label.innerHTML = previousState.userCode;
    validTime.innerText = 'Valid until ' + previousState.expiredTime;
    document.getElementById('externalLink').href = previousState.externalLink;

    refresh.onclick = retryForUserCode;
    firstPage.onclick = backToFirstPage;
    firstPageLink.onclick = backToFirstPage;
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    window.addEventListener('message', async (event) => {
        const message = event.data;
        if (message.type === DEVICE_MESSAGE_TYPE.USER_CODE) {
            const expiredTime = getExpiredTime(message.response.expires_in);
            const state = vscode.getState() || {};
            state['userCode'] = message.response.user_code;
            state['expiredTime'] = expiredTime;
            state['externalLink'] = message.response.verification_uri;
            await new Promise(() => {
                vscode.setState(state);
                const label = document.getElementById('userCode');
                label.innerHTML = message.response.user_code;
                validTime.innerText = 'Valid until ' + expiredTime;
                document.getElementById('externalLink').href = message.response.verification_uri;
            });
        } else if (message.type === DEVICE_MESSAGE_TYPE.RETRY) {
            validTime.innerText = message.information.toString();
        }
    });
};

function retryForUserCode() {
    validTime.innerText = '';
    vscode.postMessage({
        type: DEVICE_MESSAGE_TYPE.RETRY_USER_CODE
    });
}

function backToFirstPage() {
    vscode.postMessage({
        type: DEVICE_MESSAGE_TYPE.TO_FIRST_PAGE
    });
}

function getExpiredTime(expiresTime) {
    const datetime = new Date();
    datetime.setSeconds(datetime.getSeconds() + expiresTime);
    const hour = datetime.getHours();
    const minute = datetime.getMinutes();
    const expiredTime = (hour > 9 ? hour.toString() : `0${hour}`) + ':' + (minute > 9 ? minute.toString() : `0${minute}`);
    return expiredTime;
}