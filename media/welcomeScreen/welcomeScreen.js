const vscode = acquireVsCodeApi();

window.onload = function() {
    document.getElementById("createCard").onclick = function createSkill() {
        vscode.postMessage({target: 'createSkill'});
    };

    document.getElementById("importCard").onclick = function importSkill() {
        vscode.postMessage({target: 'importSkill'});
    };

    document.getElementById("profileCard").onclick = function profileManager() {
        vscode.postMessage({target: 'profileManager'});
    };

    document.getElementById("showWelcome").onclick = function showWelcomeToggle() {
        const toggleValue = document.getElementById('showWelcome').checked;
        vscode.postMessage({showWelcome: toggleValue});
    };
};

window.addEventListener("message", (event) => {
    const message = event.data;
    const enabled = message.enabled;
    document.getElementById("showWelcome").checked = enabled;
});