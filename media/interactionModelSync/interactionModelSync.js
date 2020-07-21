/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-undef */
const vscode = acquireVsCodeApi();

window.onload = function(){
    document.getElementById("syncIm").onsubmit = function syncIm() {
        const locale = document.getElementById('locale').value;
        vscode.postMessage({
            locale: locale,
        });
    };
};