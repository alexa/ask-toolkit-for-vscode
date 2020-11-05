const vscode = acquireVsCodeApi();

function selectFolder() {
    vscode.postMessage('selectFolder');
}

window.onload = function(){
    document.getElementById("createForm").onsubmit = function createNewSkill() {
        document.getElementById("createSkill").disabled = true;
        const skillName = document.getElementById('skillName').value;
        const runtime = document.getElementById('runtime').value;
        const locale = document.getElementById('defaultLanguage').value;
        const skillFolder = document.getElementById('skillFolder').value;
        const region = document.getElementById('region').value;
        vscode.postMessage({
            skillName: skillName,
            runtime: runtime,
            locale: locale,
            skillFolder: skillFolder,
            region: region
        });
    };
    // Handle the message inside the webview
    window.addEventListener('message', event => {
        const message = event.data; // The JSON data our extension sent

        if (message.reEnable) {
            document.getElementById("createSkill").disabled = false;
            return;
        }

        if (message.selectedFolder !== undefined) {
            const skillFolder = document.getElementById('skillFolder');
            skillFolder.value = message.selectedFolder;
            updateSkillFolder();
        }
    });

    const selectFolderBtn = document.getElementById('chooseFolderBtn');
    selectFolderBtn.addEventListener('click', selectFolder);

    document.getElementById("skillName").onchange = function updatePath() {
        updateSkillFolder();
    };
};

function updateSkillFolder() {
    const folder = document.getElementById('skillFolder').value;
    const skillName = document.getElementById("skillName").value;

    if (folder && skillName) {
        const filteredSkillName = skillName.replace(/[^a-zA-Z0-9-]+/g, '');
        const separator = navigator.appVersion.indexOf("Win") !== -1 ? "\\" : "/";
        document.getElementById('targetFolder').innerText = "The skill will be located at " + folder + separator + filteredSkillName;
    }
}