const vscode = acquireVsCodeApi();

window.onload = function () {
    const deployContainer = document.getElementById("deployContainer");
    const detailsContainer = document.getElementById("detailsContainer");

    const deployBtn = document.getElementById("deployBtn");
    const forceDeployBtn = document.getElementById("forceDeployBtn");
    const forceDeployText = document.getElementById("forceDeployText");
    const localChangesText = document.getElementById("localChangesText");
    const skillPackageSyncRemoteText = document.getElementById("skillPackageSyncRemoteText");
    const skillCodeSyncRemoteText = document.getElementById("skillCodeSyncRemoteText");
    const exportSkillPackageText = document.getElementById("exportSkillPackageText");
    const changesCheckIconActive = document.getElementById("changesCheckIconActive");
    const changesCheckIconInactive = document.getElementById("changesCheckIconInactive");
    const skillPackageSyncCheckIconActive = document.getElementById("skillPackageSyncCheckIconActive");
    const skillPackageSyncCheckIconInactive = document.getElementById("skillPackageSyncCheckIconInactive");
    const skillCodeSyncCheckIconActive = document.getElementById("skillCodeSyncCheckIconActive");
    const skillCodeSyncCheckIconInactive = document.getElementById("skillCodeSyncCheckIconInactive");
    const localChangeTextTdContent = document.getElementById("localChangeTextTdContent");
    const localChangeIconTdContent = document.getElementById("localChangeIconTdContent");
    const skillPackageSyncTextTdContent = document.getElementById("skillPackageSyncTextTdContent");
    const skillPackageSyncIconTdContent = document.getElementById("skillPackageSyncIconTdContent");
    const skillCodeSyncTextTdContent = document.getElementById("skillCodeSyncTextTdContent");
    const skillCodeSyncIconTdContent = document.getElementById("skillCodeSyncIconTdContent");
    const localChangeLoadingView = document.getElementById("localChangeLoadingView");
    const skillPackageLoadingView = document.getElementById("skillPackageLoadingView");
    const skillCodeLoadingView = document.getElementById("skillCodeLoadingView");
    const deployValidationLoadingView = document.getElementById("deployValidationLoadingView");
    const localChangeTextTdContentTitle = document.getElementById("localChangeTextTdContentTitle");
    const skillPackageSyncTextTdContentTitle = document.getElementById("skillPackageSyncTextTdContentTitle");
    const skillCodeSyncTextTdContentTitle = document.getElementById("skillCodeSyncTextTdContentTitle");

    // Handle the message inside the webview
    window.addEventListener("message", event => {
        const message = event.data; // The JSON data our extension sent
        const localChangesStates = message.states.LocalChangesStates;
        const skillPackageStates = message.states.SkillPackageStates;
        const skillCodeStates = message.states.SkillCodeStates;
        if (message.error !== undefined) {
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
        if (
            message.skillPackageStatesContent !== undefined &&
            skillPackageStates !== undefined &&
            message.changesStateContent.state !== localChangesStates.invalidBranch
        ) {
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
            } else if (
                (content.state === skillPackageStates.outOfSync || content.state === skillPackageStates.noETag) &&
                message.skillCodeSyncStateContent !== undefined &&
                (message.skillCodeSyncStateContent.state === skillCodeStates.upToDate ||
                    message.skillCodeSyncStateContent.state === skillCodeStates.ahead)
            ) {
                showForceDeployBtn(message);
            } else {
                hideForceDeployBtn(message);
            }
            showSkillPackageSyncTdContent();
        } else {
            hideSkillPackageSyncTdContent(
                message.changesStateContent === undefined ||
                    message.changesStateContent.state !== localChangesStates.invalidBranch
            );
        }
        if (
            message.skillCodeSyncStateContent !== undefined &&
            skillCodeStates !== undefined &&
            message.changesStateContent.state !== localChangesStates.invalidBranch
        ) {
            const content = message.skillCodeSyncStateContent;
            if (
                content.state === skillCodeStates.outOfSync ||
                content.state === skillCodeStates.diverged ||
                content.state === skillCodeStates.noSkillCode
            ) {
                deployBtn.disabled = true;
            }
            skillCodeSyncRemoteText.innerHTML = content.text;
            skillCodeSyncTextTdContentTitle.style.color = content.valid === true ? "#79868a" : "";
            skillCodeSyncRemoteText.style.color = content.valid === true ? "#79868a" : "";
            skillCodeSyncCheckIconActive.style.display = content.valid === true ? "inline" : "none";
            skillCodeSyncCheckIconInactive.style.display = content.valid === true ? "none" : "inline";
            showSkillCodeSyncTdContent();
        } else {
            hideSkillCodeSyncTdContent(
                message.changesStateContent === undefined ||
                    message.changesStateContent.state !== localChangesStates.invalidBranch
            );
        }
        deployContainer.style.visibility = "visible";
        detailsContainer.style.visibility = "visible";
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
        hideSkillCodeSyncTdContent(false);
        hideSkillPackageSyncTdContent(false);
        vscode.postMessage("refresh");
    };

    document.getElementById("exportSkillPackage").onclick = function exportSkillPackage() {
        vscode.postMessage("exportSkillPackage");
    };

    function hideAllStatesContentsAndLoadingViews() {
        hideLocalChangeTdContent(false);
        hideSkillPackageSyncTdContent(false);
        hideSkillCodeSyncTdContent(false);
        hideAllDeployButtons();
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
        if (
            message.changesStateContent !== undefined &&
            message.skillPackageStatesContent !== undefined &&
            message.skillCodeSyncStateContent !== undefined
        ) {
            forceDeployBtn.style.display = "none";
            forceDeployText.style.display = "none";
            deployBtn.style.display = "inline";
            deployValidationLoadingView.style.display = "none";
        } else {
            hideAllDeployButtons();
        }
    }

    function showForceDeployBtn(message) {
        if (
            message.changesStateContent !== undefined &&
            message.skillPackageStatesContent !== undefined &&
            message.skillCodeSyncStateContent !== undefined
        ) {
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

    function hideSkillPackageSyncTdContent(hasLoading) {
        skillPackageLoadingView.style.display = hasLoading === true ? "inline" : "none";
        skillPackageSyncTextTdContent.style.display = "none";
        skillPackageSyncIconTdContent.style.display = "none";
    }

    function showSkillPackageSyncTdContent() {
        skillPackageLoadingView.style.display = "none";
        skillPackageSyncTextTdContent.style.display = "grid";
        skillPackageSyncIconTdContent.style.display = "inline";
    }

    function hideSkillCodeSyncTdContent(hasLoading) {
        skillCodeLoadingView.style.display = hasLoading === true ? "inline" : "none";
        skillCodeSyncTextTdContent.style.display = "none";
        skillCodeSyncIconTdContent.style.display = "none";
    }

    function showSkillCodeSyncTdContent() {
        skillCodeLoadingView.style.display = "none";
        skillCodeSyncTextTdContent.style.display = "grid";
        skillCodeSyncIconTdContent.style.display = "inline";
    }
};
