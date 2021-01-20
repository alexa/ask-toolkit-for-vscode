const vscode = acquireVsCodeApi();

window.onload = function () {
    const deployContainer = document.getElementById("deployContainer");

    const deployBtn = document.getElementById("deployBtn");
    const forceDeployBtn = document.getElementById("forceDeployBtn");
    const forceDeployText = document.getElementById("forceDeployText");
    const exportSkillPackageText = document.getElementById("exportSkillPackageText");

    const changesCheckIconActive = document.getElementById("changesCheckIconActive");
    const changesCheckIconInactive = document.getElementById("changesCheckIconInactive");
    const skillPackageSyncCheckIconActive = document.getElementById("skillPackageSyncCheckIconActive");
    const skillPackageSyncCheckIconInactive = document.getElementById("skillPackageSyncCheckIconInactive");

    const localChangeTextTdContent = document.getElementById("localChangeTextTdContent");
    const localChangeIconTdContent = document.getElementById("localChangeIconTdContent");
    const skillPackageSyncTextTdContent = document.getElementById("skillPackageSyncTextTdContent");
    const skillPackageSyncIconTdContent = document.getElementById("skillPackageSyncIconTdContent");

    const localChangeLoadingView = document.getElementById("localChangeLoadingView");
    const skillPackageLoadingView = document.getElementById("skillPackageLoadingView");

    const deployValidationLoadingView = document.getElementById("deployValidationLoadingView");
    const localChangeTextTdContentTitle = document.getElementById("localChangeTextTdContentTitle");
    const skillPackageSyncTextTdContentTitle = document.getElementById("skillPackageSyncTextTdContentTitle");

    const skillPackagePath = document.getElementById("skillPackagePath");

    // Handle the message inside the webview
    window.addEventListener("message", event => {
        const message = event.data; // The JSON data our extension sent
        const localChangesStates = message.states.LocalChangesStates;
        const skillPackageStates = message.states.SkillPackageStates;

        if (message.error !== undefined) {
            hideAllStatesContentsAndLoadingViews();
            return;
        }
        if (message.skillPackagePath !== undefined) {
            skillPackagePath.innerHTML = `(${message.skillPackagePath})`;
            skillPackagePath.style.display = "inline";
        } else {
            skillPackagePath.style.display = "none";
            hideAllStatesContentsAndLoadingViews();
            return;
        }
        if (message.changesStateContent !== undefined && localChangesStates !== undefined) {
            const content = message.changesStateContent;
            deployBtn.disabled = content.valid === false;
            localChangesText.innerHTML = content.text;
            localChangeTextTdContentTitle.style.color = content.valid === true ? "#79868a" : "";
            localChangesText.style.color = content.valid === true ? "#79868a" : "";
            changesCheckIconActive.style.display = content.valid === true ? "inline" : "none";
            changesCheckIconInactive.style.display = content.valid === true ? "none" : "inline";
            if (content.state === localChangesStates.invalidBranch) {
                hideAllDeployButtons();
            }
            showLocalChangeTdContent();
        } else {
            hideLocalChangeTdContent(true);
        }
        if (message.skillPackageStatesContent !== undefined && skillPackageStates !== undefined) {
            const content = message.skillPackageStatesContent;
            skillPackageSyncRemoteText.innerHTML = content.text;
            skillPackageSyncRemoteText.style.color = content.valid === true ? "#79868a" : "";
            skillPackageSyncTextTdContentTitle.style.color = content.valid === true ? "#79868a" : "";
            exportSkillPackageText.style.display =
                content.state === skillPackageStates.outOfSync || content.state === skillPackageStates.noETag
                    ? "inline"
                    : "none";
            skillPackageSyncCheckIconActive.style.display = content.valid === true ? "inline" : "none";
            skillPackageSyncCheckIconInactive.style.display = content.valid === true ? "none" : "inline";
            if (content.state === skillPackageStates.serviceError) {
                hideAllDeployButtons();
            } else if (content.state === skillPackageStates.outOfSync || content.state === skillPackageStates.noETag) {
                showForceDeployBtn(message);
            } else {
                hideForceDeployBtn(message);
            }
            showSkillPackageSyncTdContent();
        } else {
            hideSkillPackageSyncTdContent(true);
        }
        deployContainer.style.visibility = "visible";
    });

    document.getElementById("deployBtn").onclick = function deploySkill() {
        deployBtn.disabled = true;
        deployValidationLoadingView.style.display = "inline";
        vscode.postMessage("deploySkill");
    };

    document.getElementById("forceDeployBtn").onclick = function forceDeploySkill() {
        const forceDeployBtn = document.getElementById("forceDeployBtn");
        const buttonValue = forceDeployBtn.value;
        if (buttonValue === "Force deploy") {
            forceDeployBtn.value = "Confirm force deploy";
        } else {
            forceDeployBtn.classList.remove("caution");
            forceDeployBtn.disabled = true;
            deployValidationLoadingView.style.display = "inline";
            vscode.postMessage("forceDeploy");
        }
    };

    document.getElementById("refresh").onclick = function refresh() {
        hideAllDeployButtons();
        hideLocalChangeTdContent(false);
        hideSkillPackageSyncTdContent(false);
        vscode.postMessage("refresh");
    };

    document.getElementById("exportSkillPackage").onclick = function exportSkillPackage() {
        vscode.postMessage("exportSkillPackage");
    };

    function hideAllStatesContentsAndLoadingViews() {
        hideLocalChangeTdContent(false);
        hideSkillPackageSyncTdContent(false);
        hideAllDeployButtons();
        skillPackagePath.style.display = "none";
    }

    function hideAllDeployButtons() {
        forceDeployBtn.style.display = "none";
        forceDeployText.style.display = "none";
        deployBtn.style.display = "none";
        deployValidationLoadingView.style.display = "none";
        // reset force button
        if (forceDeployBtn.value === "Confirm force deploy") {
            forceDeployBtn.value = "Force deploy";
        }
    }

    function hideForceDeployBtn(message) {
        if (message.changesStateContent !== undefined && message.skillPackageStatesContent !== undefined) {
            forceDeployBtn.style.display = "none";
            forceDeployText.style.display = "none";
            deployBtn.style.display = "inline";
            deployValidationLoadingView.style.display = "none";
        } else {
            hideAllDeployButtons();
        }
    }

    function showForceDeployBtn(message) {
        if (message.changesStateContent !== undefined && message.skillPackageStatesContent !== undefined) {
            forceDeployBtn.className = "caution";
            forceDeployBtn.style.display = "inline";
            forceDeployText.style.display = "inline";
            deployBtn.style.display = "none";
            deployValidationLoadingView.style.display = "none";
        } else {
            hideAllDeployButtons();
        }
    }

    function hideLocalChangeTdContent(loading) {
        localChangeLoadingView.style.display = loading === true ? "inline" : "none";
        localChangeTextTdContent.style.display = "none";
        localChangeIconTdContent.style.display = "none";
    }

    function showLocalChangeTdContent() {
        localChangeLoadingView.style.display = "none";
        localChangeTextTdContent.style.display = "grid";
        localChangeIconTdContent.style.display = "inline";
    }

    function hideSkillPackageSyncTdContent(loading) {
        skillPackageLoadingView.style.display = loading === true ? "inline" : "none";
        skillPackageSyncTextTdContent.style.display = "none";
        skillPackageSyncIconTdContent.style.display = "none";
    }

    function showSkillPackageSyncTdContent() {
        skillPackageLoadingView.style.display = "none";
        skillPackageSyncTextTdContent.style.display = "grid";
        skillPackageSyncIconTdContent.style.display = "inline";
    }
};
