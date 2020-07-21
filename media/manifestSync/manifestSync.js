/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-undef */
const vscode = acquireVsCodeApi();

window.onload = function(){
    document.getElementById("syncManifest").onsubmit = function syncManifest() {
        vscode.postMessage({});
    };
};