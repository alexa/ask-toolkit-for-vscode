/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
const vscode = acquireVsCodeApi();

window.onload = function () {
    document.getElementById('createForm').onsubmit = function createNewProfile() {
        document.getElementById('createButton').disabled = true;
        const profileName = document.getElementById('newProfileName').value;
        vscode.postMessage({ profileName: profileName });
        return false;
    };

    document.getElementById('deleteForm').onsubmit = function deleteProfile() {
        if (window.deleteConfirmed) {
            const profileName = document.getElementById('deleteProfiles').value;
            vscode.postMessage({ deleteProfile: profileName });
            document.getElementById('submitDelete').value = 'Delete';
            document.getElementById('deleteMessage').innerHTML = '';
            window.deleteConfirmed = false;
        } else {
            window.deleteConfirmed = true;
            document.getElementById('submitDelete').value = 'Confirm delete';
        }
        return false;
    };

    document.getElementById('deleteProfiles').onchange = function clearDelete() {
        window.deleteConfirmed = false;
        document.getElementById('submitDelete').value = 'Delete';
        document.getElementById('deleteMessage').innerHTML = '';
    };
};

window.addEventListener('message', event => {
    const message = event.data;

    if (message.reEnable) {
        document.getElementById('createButton').disabled = false;
        return;
    }

    var submits = document.getElementsByClassName('submit-existing');
    for (x = 0; x < submits.length; x++) {
        submits[x].disabled = true;
    }
    var selects = document.getElementsByClassName('existing-profiles');
    for (x = 0; x < selects.length; x++) {
        resetSelect(selects[x]);
    }
    if (message.profiles.length > 0) {
        for (i = 0; i < message.profiles.length; i++) {
            for (x = 0; x < selects.length; x++) {
                var option = document.createElement('option');
                option.text = message.profiles[i];
                option.value = message.profiles[i];
                selects[x].appendChild(option);
            }
        }
        for (x = 0; x < selects.length; x++) {
            selects[x].disabled = false;
        }
        for (x = 0; x < submits.length; x++) {
            submits[x].disabled = false;
        }
    }
});

function resetSelect(select) {
    select.disabled = true;
    select.innerHTML = '';
}

function updateProfile() {
    const profileName = document.getElementById('updateProfiles').value;
    vscode.postMessage({ profileName: profileName });
}
