const vscode = acquireVsCodeApi();

function selectFolder() {
    vscode.postMessage('selectFolder');
}

window.onload = function(){
    const hostedProvisionCard = document.getElementById("hostedProvisionCard");
    const provisionOwnCard = document.getElementById("provisionOwnCard");
    const hostedCardsContainer = document.getElementById("hostedCardsContainer");
    const selfHostedContainer = document.getElementById("selfHostedContainer");
    const hostedProvisionCardSticker = document.getElementById("hostedProvisionCardSticker");
    const provisionOwnCardSticker = document.getElementById("provisionOwnCardSticker");
    const createStatusText = document.getElementById("createStatusText");
    const createSkill = document.getElementById("createSkill");

    let isHostedSkill = true; 

    hostedProvisionCard.onclick = function selectHostedProvision() {
        hostedCardsContainer.style.display = "inline";
        selfHostedContainer.style.display = "none";
        hostedProvisionCardSticker.style.display = "flex";
        provisionOwnCardSticker.style.display = "none";
        isHostedSkill = true;
    }

    provisionOwnCard.onclick = function selectSelfProvision() {
        hostedCardsContainer.style.display = "none";
        selfHostedContainer.style.display = "inline";
        hostedProvisionCardSticker.style.display = "none";
        provisionOwnCardSticker.className = "skill-card-sticker"
        provisionOwnCardSticker.style.display = "flex";
        isHostedSkill = false;
    }


    document.getElementById("createForm").onsubmit = function createNewSkill() {
        createSkill.disabled = true;
        createStatusText.innerText = '';
        const skillName = document.getElementById('skillName').value;
        const runtime = document.getElementById('runtime').value;
        const language = document.getElementById('programmingLanguage').value;
        const locale = document.getElementById('defaultLanguage').value;
        const skillFolder = document.getElementById('skillFolder').value;
        const region = document.getElementById('region').value;
        vscode.postMessage({
            skillName,
            runtime,
            language,
            locale,
            skillFolder,
            region,
            isHostedSkill
        });
    };
    // Handle the message inside the webview
    window.addEventListener('message', event => {
        const message = event.data; // The JSON data our extension sent

        if (message.reEnable === true) {
            createSkill.disabled = false;
            return;
        }

        if (message.selectedFolder !== undefined) {
            const skillFolder = document.getElementById('skillFolder');
            skillFolder.value = message.selectedFolder;
            updateSkillFolder();
            activeCreateButton();
        }
    });

    const selectFolderBtn = document.getElementById('chooseFolderBtn');
    selectFolderBtn.addEventListener('click', selectFolder);

    document.getElementById("skillName").onchange = function updatePath() {
        updateSkillFolder();
        activeCreateButton();
    };

    document.getElementById('skillFolder').onchange = function updateFolder() {
        updateSkillFolder();
        activeCreateButton();
    }

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

    if (!isNullOrEmpty(folder) && !isNullOrEmpty(skillName)) {
        const filteredSkillName = skillName.replace(/[^a-zA-Z0-9-]+/g, '');
        const separator = navigator.appVersion.indexOf("Win") !== -1 ? "\\" : "/";
        document.getElementById('targetFolder').innerText = "The skill will be located at " + folder + separator + filteredSkillName;
        return;
    }
    document.getElementById('targetFolder').innerText = '';
}

function activeCreateButton() {

    const folder = document.getElementById('skillFolder').value;
    const skillName = document.getElementById("skillName").value;

    if (!isNullOrEmpty(folder) && !isNullOrEmpty(skillName)) {
        createSkill.disabled = false;
        createStatusText.innerText = "You are ready to create a skill.";
        return;
    }
    createSkill.disabled = true;
    if (isNullOrEmpty(folder) && isNullOrEmpty(skillName)) {
        createStatusText.innerText = "All fields are required.";
        return;
    }
    if (isNullOrEmpty(skillName)) {
        createStatusText.innerText = "Skill name is required.";
        return;
    }
    if (isNullOrEmpty(folder)) {
        createStatusText.innerText = "Local directory is required."
    }
}

function isNullOrEmpty(value) {
    return ( !value || value === undefined || value === "" || value.trim().length === 0 );
}