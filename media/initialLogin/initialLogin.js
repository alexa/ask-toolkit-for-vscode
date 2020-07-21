const vscode = acquireVsCodeApi();

window.onload = function(){
    document.getElementById("signIn").onsubmit = function signIn() {
        document.getElementById("signInButton").disabled = true;
        vscode.postMessage();
    };
};