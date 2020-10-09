const vscode = acquireVsCodeApi();
let numMessages = 0;
let storageIndex = 0;
let messageStorage = [];
let currentTabGlobal;
let isDragging = false;
let isNewSession = false;
let isReplayMode = false;
let isDevConsoleLinkShowed = false;
let replayInputList = [];
let replayIndex = 0;
let renderer;

const MAX_MESSAGE_STORAGE = 100;
const JSON_BOX_MIN_WIDTH = 50;
const RESIZER_WIDTH_OFFSET = 8;
const DELAY_BETWEEN_REPLAY_REQUESTS_MS = 1000;
const DEVELOPMENT = 'development';
const ENABLED_SKILL = 'enabled_skill';
const DISABLED_SKILL = 'disabled_skill';
const ENABLE_SKILL = 'enable_skill';
const DISABLE_SKILL = 'disable_skill';
const CHECK_SKILL_STATUS = 'check_skill_status';
const CHECK_AVAILABLE_LOCALES = 'check_available_locales';
const UPDATE_LOCALE = 'update_locale';
const LINK_DEV_CONSOLE = 'link_dev_console';
const ENABLE = 'enable';
const DISABLE = 'disable';
const MESSAGE_SPLITTER = '/NEXT_MESSAGE/';
const NONE = 'none';
const TYPING = 'Typing';
const LOADING = 'loading';

const MSG_NUM = 'msgNum';
const CHAT_AREA = 'chatArea';
const CHATBOX_INPUT = 'chatboxInput';
const SEND_BUTTON = 'sendButton';
const EXPORT_BUTTON = 'exportBtn';
const RESET_BUTTON = 'resetBtn';
const IO_TAB = 'ioTab';
const INFO_BOX = 'skillInfoBox';
const STAGE_DROPDOWN = 'stageDropdown';
const LOCALE_DROPDOWN = 'localeDropdown';
const MESSAGE_CONTAINER = 'messageContainer';
const JSON_INPUT_CODE = 'jsonInputCode';
const JSON_OUTPUT_CODE = 'jsonOutputCode';
const JSON_BOX_INPUT = 'jsonBoxInput';
const EXECUTION_INFO_CODE = 'executionInfoCode';
const EXECUTION_INFO_TAB = 'executionInfoTab';
const APL_VIEW_TAB = 'aplViewTab';
const APL_VIEW_BOX = 'aplViewBox';
const PREVIEW_APL_BUTTON= 'previewAplButton';
const RESIZER = 'resizer';
const CODE = 'code';
const ACTIVE = 'active';
const TAB_BUTTON_TYPE = {
    'skillIOButton': 'ioTab',
    'executionInfoButton': 'executionInfoTab',
    'previewAplButton': 'aplViewTab'
}
const SIMULATOR_MESSAGE_TYPE = {
    SKILL_STATUS: 'skill_status',
    LOCALE: 'locale',
    UTTERANCE: 'utterance',
    REPLAY: 'replay',
    EXPORT: 'export',
    ACTION: 'action',
    VIEWPORT: 'viewport',
    EXCEPTION: 'exception'
}

window.onload = function () {
    const chatArea = document.getElementById(CHAT_AREA);
    const chatboxInput = document.getElementById(CHATBOX_INPUT);
    const stageDropdown = document.getElementById(STAGE_DROPDOWN);
    const localeDropdown = document.getElementById(LOCALE_DROPDOWN);

    const previousState = vscode.getState();
    if (previousState) {
        restorePreviousSimulatorState(previousState);
    }
    else {
        resetChatSession();
    }
    checkSkillStatus();
    checkAvailableLocales();

    saveFullState();

    // Resize JSON boxes when user drags resizer bar
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', resizeJsonBoxWidth);
    document.addEventListener('mouseup', handleMouseUp);

    // Upon input submission, update chat box UI
    chatArea.onsubmit = updateChatBox;

    // Auto-fill previous inputs in chat box on up & down arrow key presses
    chatboxInput.onkeydown = autofillPreviousMessage;

    // Enable/disable skill based on dropdown choice
    stageDropdown.onchange = skillStageSelect;

    // Upon selection of a new locale, clear the chatbox & info tabs
    localeDropdown.onchange = updateLocale;

    // Display subtabs based on user's button click
    skillIOButton.onclick = showSelectedTab;
    executionInfoButton.onclick = showSelectedTab;
    previewAplButton.onclick = showSelectedTab;

    //Export session
    exportBtn.onclick = exportReplayFile;
    //Reset session
    resetBtn.onclick = resetChatSession;
    //Show link to developer console
    aplViewBox.onclick = showDevConsoleLink;

    // Handle message received from extension
    window.addEventListener('message', handleMessageFromExtension);
}


/**
 * Post message to extension for downloading the current session.
 */
function exportReplayFile() {
    const locale = document.getElementById(LOCALE_DROPDOWN).value;
    vscode.postMessage({
        skillLocale: locale,
        type: SIMULATOR_MESSAGE_TYPE.EXPORT,
        exportUtterance: messageStorage
    });
}

/**
 * Reset and initialize session.
 */
function resetChatSession() {
    vscode.setState({});

    //Update aplView
    const aplDiv = document.getElementById("aplView");
    aplDiv.innerHTML = '';
    const newHtml = `
        <div class="aplViewText" id="aplViewText"> 
            There is no visual content to display.
        </div>
    `;
    aplDiv.insertAdjacentHTML('beforeend', newHtml);

    showSpecificTab(IO_TAB);
    AplRenderer.initEngine();
    clearUI();
}

/**
 * Show the default tab when load, reset or restore simulator.
 * @param {string} the tab to show.
 */
function showSpecificTab(tabToShow) {
    const findKey = (value, compare = (a, b) => a === b) => {
        return Object.keys(TAB_BUTTON_TYPE).find(k => compare(TAB_BUTTON_TYPE[k], value));
    }
    const currentButton = findKey(tabToShow);

    showSelectedButton(currentButton);
}

/**
 * When a tab is selected, reveal corresponding content.
 * @param {MouseEvent} event.
 */
function showSelectedTab(event) {
    const currentButton = event.currentTarget.id.toString();
    showSelectedButton(currentButton);
}

/**
 * Show the specific tab and hide other tabs.
 * @param {string} the button of the selected tab.
 */
function showSelectedButton(button) {
    const tabButtons = document.getElementsByClassName('tabButton');
    const currentButton = document.getElementById(button);

    for (const tabButton of tabButtons) {
        tabButton.classList.remove(ACTIVE);
        const buttonName = tabButton.id.toString();
        const isButtonSelected = (button === buttonName);
        const tabName = TAB_BUTTON_TYPE[buttonName];
        showSelectedTabContent(tabName, isButtonSelected);
    }
    currentButton.classList.add(ACTIVE);

    currentTabGlobal = TAB_BUTTON_TYPE[button];
    saveElementState(INFO_BOX);
}

/**
 * When a tab is selected, reveal corresponding content
 * @param {string} tabId
 * @param {boolean} isSelected 
 */
function showSelectedTabContent(tabId, isSelected) {
    const tabInfo = document.getElementById(tabId);
    const tabArray = Array.from(tabInfo.children);
    tabInfo.style.display = (isSelected === true) ? "" : NONE;
    for (const tabContent of tabArray) {
        tabContent.style.display = (isSelected === true) ? "" : NONE;
    }
}

/**
 * Handle when user sets mouse down on the resizer bar
 * @param {MouseEvent} event 
 */
function handleMouseDown(event) {
    const resizer = document.getElementById(RESIZER);
    const codeBlocks = document.getElementsByTagName(CODE);

    if (event.target === resizer) {
        isDragging = true;
        Array.from(codeBlocks, event => event.style.userSelect = NONE);
    }
}

/**
 * Handle when user lifts mouse from resizer bar
 */
function handleMouseUp() {
    const codeBlocks = document.getElementsByTagName(CODE);
    isDragging = false;
    Array.from(codeBlocks, event => event.style.userSelect = 'auto');
}

/**
 * When user is dragging resizer bar, resize width
 * of JSON input & output boxes
 * @param {MouseEvent} event 
 */
function resizeJsonBoxWidth(event) {
    if (!isDragging) {
        return false;
    }
    event.preventDefault(); // prevent accidental scrolling of JSON box

    const jsonBoxInput = document.getElementById(JSON_BOX_INPUT);
    const pointerRelativeXpos = event.clientX - jsonBoxInput.offsetLeft;

    jsonBoxInput.style.width = Math.max(JSON_BOX_MIN_WIDTH, pointerRelativeXpos - RESIZER_WIDTH_OFFSET).toString() + 'px';
    saveElementState(INFO_BOX);
}

/**
 * Upon loading the Simulator, check what interaction models
 * exist for the skill
 */
function checkAvailableLocales() {
    let currentLocale;
    const previousState = vscode.getState();
    if (previousState.localeSelection !== undefined && previousState.localeSelection !== LOADING) {
        currentLocale = previousState.localeSelection;
    }
    vscode.postMessage({
        message: CHECK_AVAILABLE_LOCALES,
        currentLocale: currentLocale,
        type: SIMULATOR_MESSAGE_TYPE.LOCALE
    });
}

/**
 * Upon loading the Simulator, check if skill has already been 
 * enabled for testing (skill could have been enabled through CLI, for example)
 */
function checkSkillStatus() {
    vscode.postMessage({
        message: CHECK_SKILL_STATUS,
        type: SIMULATOR_MESSAGE_TYPE.SKILL_STATUS
    });
}

/**
 * When Webview is brought back into visibility,
 * restore the previous state & data of the HTML elements
 * @param {object} previousState last saved state of Simulator
 */
function restorePreviousSimulatorState(previousState) {
    const messageContainer = document.getElementById(MESSAGE_CONTAINER);
    document.getElementById(INFO_BOX).innerHTML = previousState.infoBoxContent;
    //restore the correct tab
    const tabToShow = previousState.currentTabGlobal;
    showSpecificTab(tabToShow);

    numMessages = previousState.numMessages;
    storageIndex = previousState.storageIndex;
    messageStorage = previousState.storedMessages.split(MESSAGE_SPLITTER);
    if (messageStorage[0] === '') {
        // messageStorage was empty in previousState,
        // remove extraneous blank entry created by .split()
        messageStorage = [];
    }

    if (previousState.stageSelection === DEVELOPMENT) {
        stageDropdown.value = previousState.stageSelection;
        setHTMLElementStatuses(ENABLE);
    }
    messageContainer.innerHTML = previousState.chatboxState;
    messageContainer.scrollTop += messageContainer.clientHeight;

    document.getElementById(JSON_BOX_INPUT).style.width = previousState.jsonBoxInputWidth;
}

/**
 * Save the state of the entire Simulator
 * (chat box messages, Skill I/O tab JSON content, 
 *  skill stage dropdown, messageStorage array)
 */
function saveFullState() {
    if (numMessages === 0) {
        disableExportAndReset();
    }
    saveElementState(STAGE_DROPDOWN);
    saveElementState(LOCALE_DROPDOWN);
    saveElementState(INFO_BOX);
    saveElementState(MESSAGE_CONTAINER);
}

/**
 * Save the state of the specified Simulator element
 * @param {string} elementName STAGE_DROPDOWN, INFO_BOX, or MESSAGE_CONTAINER
 */
function saveElementState(elementName) {
    const state = vscode.getState() || {};
    const UNRECOGNIZED_ELEMENT_ERROR = 'Error: unrecognized element specified';

    if (elementName === STAGE_DROPDOWN) {
        const stageSelection = document.getElementById(STAGE_DROPDOWN).value;
        state['stageSelection'] = stageSelection;
    }
    else if (elementName === LOCALE_DROPDOWN) {
        const localeSelection = document.getElementById(LOCALE_DROPDOWN).value;
        if (localeSelection !== undefined && localeSelection !== LOADING) {
            state['localeSelection'] = localeSelection;
        }
    }
    else if (elementName === INFO_BOX) {
        const infoBoxContent = document.getElementById(INFO_BOX).innerHTML;
        const jsonBoxInputWidth = document.getElementById(JSON_BOX_INPUT).style.width;
        state['infoBoxContent'] = infoBoxContent;
        state['jsonBoxInputWidth'] = jsonBoxInputWidth;
        state['currentTabGlobal'] = currentTabGlobal;
    }
    else if (elementName === MESSAGE_CONTAINER) {
        const chatboxState = document.getElementById(MESSAGE_CONTAINER).innerHTML;
        const stringOfStoredMessages = messageStorage.join(MESSAGE_SPLITTER);
        state['chatboxState'] = chatboxState;
        state['numMessages'] = numMessages;
        state['storageIndex'] = storageIndex;
        state['storedMessages'] = stringOfStoredMessages;
    }
    else {
        throw UNRECOGNIZED_ELEMENT_ERROR;
    }

    vscode.setState(state);
}

/**
 * Handle message received from extension
 * @param {MessageEvent} event string or JSON object
 */
async function handleMessageFromExtension(event) {
    const message = event.data;
    const stageDropdown = document.getElementById(STAGE_DROPDOWN);
    if (message.type === SIMULATOR_MESSAGE_TYPE.SKILL_STATUS) {
        handleSkillStatusMessage(message);
    }

    else if (message.type === SIMULATOR_MESSAGE_TYPE.LOCALE) {
        displayLocales(message);
    }

    else if (message.type === SIMULATOR_MESSAGE_TYPE.UTTERANCE) {
        if (stageDropdown.value === DEVELOPMENT) {
            if ('errorResponse' in message) {
                handleErrorMessage(message.error);
            }
            else if ('alexaResponse' in message) {
                handleAlexaResponse(message);
            }
            checkReplayList();
            if (isReplayMode === false) {
                setHTMLElementStatuses(ENABLE);
            }
        }
    }
    else if (message.type === SIMULATOR_MESSAGE_TYPE.REPLAY && message.replay.length > 0) {
        handleReplayResponse(message);
    }
    else if (message.type === SIMULATOR_MESSAGE_TYPE.VIEWPORT) {
        if (message.newViewport !== undefined && message.documents !== undefined) {
            await updateAplViewPort(message.documents, message.dataSources, JSON.parse(message.newViewport));
        }
        else{
            showSelectedButton(PREVIEW_APL_BUTTON);
        }
    }
    else if (message.type === SIMULATOR_MESSAGE_TYPE.EXCEPTION) {
        removeAlexaTypingIndicator();
        if (stageDropdown.value === DEVELOPMENT) {
            setHTMLElementStatuses(ENABLE);
        }
    }
}

/**
 * Handle message returned by extension related to skill 
 * @param {string} message, enable skill or disable skill
 */
function handleSkillStatusMessage(message) {
    if (message.message === ENABLED_SKILL) {
        stageDropdown.value = DEVELOPMENT;
        setHTMLElementStatuses(ENABLE);
        setDisplayColorScheme(ENABLE);
    }
    else if (message.message === DISABLED_SKILL) {
        setHTMLElementStatuses(DISABLE);
        setDisplayColorScheme(DISABLE);
        removeAlexaTypingIndicator();
    }
}

/**
 * Update device display using the new viewport
 * @param {string} document
 * @param {string} dataSource
 * @param {Object} viewport
 */
async function updateAplViewPort(document, dataSource, viewport) {
    showSelectedButton(PREVIEW_APL_BUTTON);
    await loadAplDoc(
        renderer,
        document,
        dataSource,
        viewport,
        APL_VIEW_BOX
    );
    saveElementState(INFO_BOX);
}

/**
 * Helper for handling extension message;
 * Handle error message returned by extension if simulation request failed
 * @param {string} errorMessage
 */
function handleErrorMessage(errorMessage) {
    updateAlexaResponse(errorMessage);
    document.getElementById(JSON_INPUT_CODE).textContent = '';
    document.getElementById(JSON_OUTPUT_CODE).textContent = '';
    document.getElementById(EXECUTION_INFO_CODE).textContent = '';
    saveElementState(INFO_BOX);
}

/**
 * Helper for handling extension message;
 * Handle & format Alexa response returned by successful simulation request
 * @param {object} message 
 */
async function handleAlexaResponse(message) {
    const chatboxInput = document.getElementById(CHATBOX_INPUT);

    if (message.alexaResponse.length === 0) {
        removeAlexaTypingIndicator();
    }
    else {
        message.alexaResponse.forEach(response => updateAlexaResponse(response));
        //If message contains datasource and document, will show APL preview
        if (message.viewport !== undefined && message.documents !== undefined) {
            await updateAplViewPort(message.documents, message.dataSources, JSON.parse(message.viewport));
        }
    }
    extractSkillInfoData(message);
}

/**
 * Check the replay list and go on replay
 */
function checkReplayList() {
    if (replayIndex < replayInputList.length) {
        setTimeout(function () {
            sendUtteranceRequest(replayInputList[replayIndex++]);
        }, DELAY_BETWEEN_REPLAY_REQUESTS_MS);
    }
    else {
        isReplayMode = false;
    }
}

/**
 * Helper for handling extension message;
 * Handle & format inputs for replay returned by successful simulation request
 * @param {object} message 
 */
function handleReplayResponse(message) {
    replayInputList = message.replay;
    replayIndex = 0;
    isReplayMode = true;
    setHTMLElementStatuses(DISABLE);
    sendUtteranceRequest(replayInputList[replayIndex++]);
}

/**
 * Helper for handling extension message;
 * Display the available locales in the locale dropdown
 * @param {object} message 
 */
function displayLocales(message) {
    const availableLocales = message.locale.availableLocales;
    const localeDropdown = document.getElementById(LOCALE_DROPDOWN);
    const localesList = {
        'en-US': `<option value='en-US'>English (US)</option>`,
        'en-AU': `<option value='en-AU'>English (AU)</option>`,
        'en-CA': `<option value='en-CA'>English (CA)</option>`,
        'en-IN': `<option value='en-IN'>English (IN)</option>`,
        'en-GB': `<option value='en-GB'>English (UK)</option>`,
        'de-DE': `<option value='de-DE'>German (DE)</option>`,
        'es-ES': `<option value='es-ES'>Spanish (ES)</option>`,
        'es-MX': `<option value='es-MX'>Spanish (MX)</option>`,
        'fr-FR': `<option value='fr-FR'>French (FR)</option>`,
        'it-IT': `<option value='it-IT'>Italian (IT)</option>`,
        'ja-JP': `<option value='ja-JP'>Japanese (JP)</option>`,
        'fr-CA': `<option value='fr-CA'>French (CA)</option>`,
        'pt-BR': `<option value='pt-BR'>Portuguese (BR)</option>`,
        'hi-IN': `<option value='hi-IN'>Hindi (IN)</option>`,
        'es-US': `<option value='es-US'>Spanish (US)</option>`
    };

    localeDropdown.innerHTML = '';
    for (const index in availableLocales) {
        const locale = availableLocales[index];
        localeDropdown.insertAdjacentHTML('beforeend', localesList[locale]);
    }

    const previousState = vscode.getState();
    if (previousState.localeSelection !== undefined && previousState.localeSelection !== LOADING) {
        localeDropdown.value = previousState.localeSelection;
    }
}

/**
 * When user enters input, update chat box UI with user message
 * and send message containing input to extension
 */
function updateChatBox() {
    // add '' to make it raw text, rather than possibly HTML
    const text = chatboxInput.value;
    chatboxInput.value = '';

    sendUtteranceRequest(text);
}

/**
 * Get the user input, then post message to the extension.
 * @param {string} text, the input of user 
 */
function sendUtteranceRequest(text) {
    const locale = document.getElementById(LOCALE_DROPDOWN).value;
    const inputText = (text + '').toLowerCase();

    if (isValidInput(inputText)) {
        addToMessageStorage(inputText);
        appendUserMessage(inputText);
        setHTMLElementStatuses(DISABLE); // prevent another request while current one in progress
        appendAlexaTypingIndicator();

        const createNewSession = (isNewSession === true);
        isNewSession = false;
        vscode.postMessage({
            userInput: inputText,
            skillLocale: locale,
            sessionMode: createNewSession,
            type: SIMULATOR_MESSAGE_TYPE.UTTERANCE
        });
    }
    saveElementState(MESSAGE_CONTAINER);
}

/**
 * Upon up & down arrow key presses, auto-fill input box with 
 * previous messages (up to last 10 messages are available for auto-fill)
 */
function autofillPreviousMessage() {
    if (event.key === 'ArrowUp') {
        handleArrowUp();
    }
    else if (event.key === 'ArrowDown') {
        handleArrowDown();
    }
    else { return; }
}

/**
 * Helper functions for autofillPreviousMessage()
 * to auto-fill previous messages based on type of key press
 */
function handleArrowUp() {
    if (storageIndex > 0 && storageIndex <= messageStorage.length) {
        storageIndex--;
        chatboxInput.value = messageStorage[storageIndex];
    }
}
function handleArrowDown() {
    if (storageIndex >= -1 && storageIndex < messageStorage.length - 1) {
        storageIndex++;
        chatboxInput.value = messageStorage[storageIndex];
    }
    else if (storageIndex === messageStorage.length - 1) {
        storageIndex++;
        chatboxInput.value = '';
    }
}

/**
 * Based on dropdown selection ("development" or "off"),
 * enable or disable the user's skill
 */
function skillStageSelect() {
    const selection = stageDropdown.value;
    saveElementState(STAGE_DROPDOWN);
    const skillAction = (selection === DEVELOPMENT) ? ENABLE_SKILL : DISABLE_SKILL;
    vscode.postMessage({
        message: skillAction,
        type: SIMULATOR_MESSAGE_TYPE.SKILL_STATUS
    });
}

/**
 * When a different locale is selected, clear previous
 * chat box message bubbles & Simulation Information tabs
 */
function updateLocale() {
    const locale = document.getElementById(LOCALE_DROPDOWN).value;
    vscode.postMessage({
        message: UPDATE_LOCALE,
        skillLocale: locale,
        type: SIMULATOR_MESSAGE_TYPE.LOCALE
    });
    clearUI();
    saveElementState(LOCALE_DROPDOWN);
}
/**
 * Clear previous
 * chat box message bubbles & Simulation Information tabs
 */
function clearUI() {
    document.getElementById(MESSAGE_CONTAINER).innerHTML = '';
    document.getElementById(JSON_INPUT_CODE).textContent = '';
    document.getElementById(JSON_OUTPUT_CODE).textContent = '';
    document.getElementById(EXECUTION_INFO_CODE).textContent = '';

    messageStorage = [];
    numMessages = 0;
    storageIndex = 0;
    isNewSession = true;
    const chatboxInput = document.getElementById(CHATBOX_INPUT);
    chatboxInput.focus();

    saveFullState();
}

/**
 * Extract JSON input & output data from API response
 * and put formatted data into Skill Info tab's boxes
 * @param {object} message
 */
function extractSkillInfoData(message) {
    // format JSON data with indents of 2 spaces
    let invocationRequestJson = '';
    let invocationResponseJson = '';

    message.invocationRequests.forEach(request => {
        invocationRequestJson += JSON.stringify(request, null, 2);
    });

    message.invocationResponses.forEach(response => {
        invocationResponseJson += JSON.stringify(response, null, 2);
    });

    const executionInfoJson = JSON.stringify(message.alexaExecutionInfo, null, 2);

    document.getElementById(JSON_INPUT_CODE).textContent = invocationRequestJson;
    document.getElementById(JSON_OUTPUT_CODE).textContent = invocationResponseJson;
    document.getElementById(EXECUTION_INFO_CODE).textContent = executionInfoJson;

    saveElementState(INFO_BOX);
}

/**
 * Enable or disable the chat box, send button, and IO tab
 * to allow or prohibit input based on dropdown status
 * @param {string} status 'enable' or 'disable'
 */
function setHTMLElementStatuses(status) {
    const enableStatus = (status === ENABLE);
    const NOT_ALLOWED = 'not-allowed';
    const DEFAULT = 'default';
    const POINTER = 'pointer';
    const PLACEHOLDER = 'Enter text or use <up arrow> for history';

    //set the status of chatbox
    const chatboxInput = document.getElementById(CHATBOX_INPUT);
    chatboxInput.disabled = !enableStatus;
    chatboxInput.style.cursor = (enableStatus) ? DEFAULT : NOT_ALLOWED;
    chatboxInput.placeholder = (enableStatus) ? PLACEHOLDER : '';
    chatboxInput.value = '';
    if (enableStatus) {
        chatboxInput.focus();
    }

    //set the status of tabs
    const tabIds = [IO_TAB, EXECUTION_INFO_TAB, APL_VIEW_TAB];
    for (const tabId of tabIds) {
        const tab = document.getElementById(tabId);
        tab.style.cursor = (enableStatus) ? DEFAULT : NOT_ALLOWED;
    }

    //set the status of buttons
    const buttonIds = [SEND_BUTTON, EXPORT_BUTTON, RESET_BUTTON];
    for (const buttonId of buttonIds) {
        const button = document.getElementById(buttonId);
        button.disabled = !(enableStatus);
        button.style.cursor = (enableStatus) ? POINTER : NOT_ALLOWED;
    }
    if (numMessages === 0) {
        disableExportAndReset();
    }
}

/**
 * Disable export button and reset button when the number of message is 0.
 */
function disableExportAndReset() {
    const exportButton = document.getElementById(EXPORT_BUTTON);
    exportButton.disabled = true;
    exportButton.style.cursor = 'not-allowed';
    const resetButton = document.getElementById(RESET_BUTTON);
    resetButton.disabled = true;
    resetButton.style.cursor = 'not-allowed';
}

/**
 * Upon disabling or enabling, change color scheme of display 
 * (chat messages and JSON code color)
 * @param {string} status 'enable' or 'disable'
 */
function setDisplayColorScheme(status) {
    const codeBlocks = document.getElementsByTagName(CODE);
    const alexaResponses = document.getElementsByClassName('alexaBubble');
    const userMessages = document.getElementsByClassName('userBubble');

    const disabledAlexaBubble = 'disabledAlexaBubble';
    const disabledUserBubble = 'disabledUserBubble';
    const disabledJsonDisplay = 'disabledJsonDisplay';

    if (status === ENABLE) {
        for (const alexaResponse of alexaResponses) {
            alexaResponse.classList.remove(disabledAlexaBubble);
        }
        for (const userMessage of userMessages) {
            userMessage.classList.remove(disabledUserBubble);
        }
        for (const codeBlock of codeBlocks) {
            codeBlock.classList.remove(disabledJsonDisplay);
        }
    }
    else {
        for (const alexaResponse of alexaResponses) {
            alexaResponse.classList.add(disabledAlexaBubble);
        }
        for (const userMessage of userMessages) {
            userMessage.classList.add(disabledUserBubble);
        }
        for (const codeBlock of codeBlocks) {
            codeBlock.className = disabledJsonDisplay;
        }
    }
    saveFullState();
}


/**
 * Display a typing indicator for Alexa while waiting
 * for Simulation API's response with Alexa response content
 */
function appendAlexaTypingIndicator() {
    const messageContainer = document.getElementById(MESSAGE_CONTAINER);
    const newMessageId = MSG_NUM.concat(numMessages, TYPING);

    const newMessageHtml = `
        <div class="msg">
            <div class="msgImg">
                <img src="https://d34a6e1u0y0eo2.cloudfront.net/media/images/alexa.png"/>
            </div>
            <div class="msgBubble alexaBubble">
                <div id=${newMessageId}>
                    <span class="typingDot dot1"></span>
                    <span class="typingDot dot2"></span>
                    <span class="typingDot dot3"></span>
                </div>
            </div>
        </div>
    `;

    messageContainer.insertAdjacentHTML('beforeend', newMessageHtml);
    messageContainer.scrollTop += messageContainer.clientHeight; // scroll down to newest message
    saveElementState(MESSAGE_CONTAINER);
}


/**
 * Update the last message (Alexa typing indicator) with Alexa's response
 * retrieved from Simulation API
 * @param {string} text content of Alexa's response
 **/
function updateAlexaResponse(text) {
    const messageContainer = document.getElementById(MESSAGE_CONTAINER);
    const messageId = MSG_NUM.concat(numMessages, TYPING);
    const updatedMessageId = MSG_NUM.concat(numMessages);
    const currentAlexaBubble = document.getElementById(messageId);
    
    if (currentAlexaBubble) {
        // remove typing indicator <span> elements
        while (currentAlexaBubble.firstChild) {
            currentAlexaBubble.removeChild(currentAlexaBubble.lastChild);
        }
        currentAlexaBubble.insertAdjacentText('beforeend', text);
        currentAlexaBubble.id = updatedMessageId;
    }
    else {
        // no current typing indicator bubble present, append new Alexa bubble
        const newMessageId = MSG_NUM.concat(numMessages);
        const newMessageHtml = `
            <div class="msg">
                <div class="msgImg">
                    <img src="https://d34a6e1u0y0eo2.cloudfront.net/media/images/alexa.png"/>
                </div>
                <div class="msgBubble alexaBubble">
                    <div id=${newMessageId}>
                    </div>
                </div>
            </div>
        `;

        messageContainer.insertAdjacentHTML('beforeend', newMessageHtml);
        document.getElementById(newMessageId).insertAdjacentText('beforeend', text);
    }
    
    numMessages++;
    messageContainer.scrollTop += messageContainer.clientHeight; // scroll down to newest message
    saveElementState(MESSAGE_CONTAINER);
}


/**
 * If user ended session ('exit') or disabled skill in the middle of
 * a simulation request, remove the hanging Alexa typing indicator bubble
 */
function removeAlexaTypingIndicator() {
    const messageId = MSG_NUM.concat(numMessages, TYPING);
    const lastAlexaBubble = document.getElementById(messageId);

    if (lastAlexaBubble) {
        const lastAlexaMessageParent = lastAlexaBubble.parentElement.parentElement;
        while (lastAlexaMessageParent.firstChild) {
            lastAlexaMessageParent.removeChild(lastAlexaMessageParent.lastChild);
        }
        lastAlexaMessageParent.remove();
    }
    saveElementState(MESSAGE_CONTAINER);
}


/**
 * Update chat box UI with user message bubble
 * @param {string} text user's input
 **/
function appendUserMessage(text) {
    const messageContainer = document.getElementById(MESSAGE_CONTAINER);
    const newMessageId = MSG_NUM.concat(numMessages);
    numMessages++;

    const newMessageHtml = `
        <div class="msg userInput">
            <div class="msgBubble userBubble">
                <div id=${newMessageId}>
                </div>
            </div>
        </div>  
    `;

    messageContainer.insertAdjacentHTML('beforeend', newMessageHtml);
    document.getElementById(newMessageId).insertAdjacentText('beforeend', text);
    messageContainer.scrollTop += messageContainer.clientHeight;
    saveElementState(MESSAGE_CONTAINER);
}


/**
 * Adds newest message & pops oldest message
 * (for auto-fill previous response functionality)
 * @param {string} inputText 
 */
function addToMessageStorage(inputText) {
    if (messageStorage.length > MAX_MESSAGE_STORAGE) {
        messageStorage.shift();
    }
    messageStorage.push(inputText);
    storageIndex = messageStorage.length;
}


/**
 * Checks validity of user's text input
 * @param {string} input 
 * @returns {boolean} true if input is valid; false if it is not
 */
function isValidInput(input) {
    if (input && (input.replace(/\s+/g, '').length > 0)) {
        return true;
    }
    return false;
}

/**
 * Show up a message that the device preview doesn't support interactions now
 * Show up only once
 */
function showDevConsoleLink() {
    if(isDevConsoleLinkShowed === false){
        const currLocale = document.getElementById(LOCALE_DROPDOWN).value;
        vscode.postMessage({
            message: LINK_DEV_CONSOLE,
            locale: currLocale,
            type: SIMULATOR_MESSAGE_TYPE.ACTION
        });
        isDevConsoleLinkShowed = true;
    }  
}
