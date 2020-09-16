// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/no-unsafe-call */

'use strict'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const join = require('path').join

/**
 * This file serves as the extension's entryPoint.
 * It loads the actual entryPoint from a webpack bundle or from
 * tsc compiled source based on the ASK_TOOLKIT_IGNORE_WEBPACK_BUNDLE environment variable.
 *
 * This allows us to activate the extension from tests.
 */

Object.defineProperty(exports, '__esModule', { value: true })

const extensionEntryPath = useBundledEntryPoint() === true
    ? join(__dirname, 'dist', 'extension')
    : join(__dirname, 'out', 'src', 'extension');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const extension = require(extensionEntryPath);

async function activate(context) {

    await extension.activate(context);
}

async function deactivate() {
    await extension.deactivate();
}

function useBundledEntryPoint() {

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    return (process.env.ASK_TOOLKIT_IGNORE_WEBPACK_BUNDLE || 'false').toLowerCase() !== 'true';
}

exports.activate = activate;
exports.deactivate = deactivate;
