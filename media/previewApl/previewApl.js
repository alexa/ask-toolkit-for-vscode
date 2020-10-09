// has to put the script here
// load separate js file by vscode and renderer init sometimes has race condition
let renderer;
const vscode = acquireVsCodeApi();
const EMPTY_STRING = '';

window.onload = function () {
    initialize();
};

window.addEventListener("message", (event) => {
    const message = event.data; // The json data that the extension sent
    loadAplDoc(
        renderer,
        message.document,
        message.datasources,
        JSON.parse(message.viewport),
        EMPTY_STRING
    );
});

function initialize() {
    // init renderer engine
    AplRenderer.initEngine().then(() => {
        vscode.postMessage({});
    });
}

