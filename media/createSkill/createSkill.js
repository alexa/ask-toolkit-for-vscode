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

    const locale = document.getElementById("defaultLanguage");
    
    locale.onchange = function updateHostedRegion() {
        // locale to region mapping from https://developer.amazon.com/en-US/docs/alexa/hosted-skills/build-a-skill-end-to-end-using-an-alexa-hosted-skill.html#regions
        const defaultHostingRegionLocaleMap = {
            'en-US' : 'US_EAST_1',
            'en-AU' : 'US_WEST_2',
            'en-CA' : 'US_EAST_1',
            'en-IN' : 'EU_WEST_1',
            'en-GB' : 'EU_WEST_1',
            'de-DE' : 'EU_WEST_1',
            'es-ES' : 'EU_WEST_1',
            'es-MX' : 'US_EAST_1',
            'fr-FR' : 'EU_WEST_1',
            'it-IT' : 'EU_WEST_1',
            'ja-JP' : 'US_WEST_2',
            'fr-CA' : 'US_EAST_1',
            'pt-BR' : 'US_EAST_1',
            'hi-IN' : 'EU_WEST_1',
            'es-US' : 'US_EAST_1'
        };
        const defaultRegion = document.getElementById("region");
        defaultRegion.value = defaultHostingRegionLocaleMap[locale.value];
    }
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