/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import * as open from 'open';
import { IncomingMessage, ServerResponse, Server } from 'http';
import { URLSearchParams } from 'url';

import { AUTH, LOCALHOST_PORT } from '../constants';
import { Utils } from '../runtime';
import { Logger } from '../logger';
import { loggableAskError } from '../exceptions';
import { ServerFactory } from '../runtime/lib/utils/serverFactory';

/**
 * Build and open the url that navigates user to captcha validation page after login.
 * @param captcha validation url
 * @param vendorId
 */
async function _openLoginUrlWithRedirectLink(captchaUrl: string, vendorId: string): Promise<void> {
    Logger.verbose(`Calling method: _openLoginUrlWithRedirectLink, args: `, captchaUrl, vendorId);
    const envVarSignInHost = process.env.ASK_LWA_AUTHORIZE_HOST;
    const loginUrl = new URL(envVarSignInHost && Utils.isNonBlankString(envVarSignInHost)
        ? envVarSignInHost + AUTH.SIGNIN_PATH : AUTH.SIGNIN_URL);

    loginUrl.search = new URLSearchParams([
        ['openid.ns', 'http://specs.openid.net/auth/2.0'],
        ['openid.mode', 'checkid_setup'],
        ['openid.claimed_id', 'http://specs.openid.net/auth/2.0/identifier_select'],
        ['openid.identity', 'http://specs.openid.net/auth/2.0/identifier_select'],
        ['openid.assoc_handle', 'amzn_dante_us'],
        ['openid.return_to', `${captchaUrl}?vendor_id=${vendorId}&redirect_url=http://127.0.0.1:${LOCALHOST_PORT}/captcha`],
        ['openid.pape.max_auth_age', '7200']
    ]).toString();
    await open(loginUrl.href);
}

function _handleServerRequest(request: IncomingMessage, response: ServerResponse, server: Server): Promise<void> {
    Logger.verbose(`Calling method: _handleServerRequest`);
    response.on('close', () => {
        request.socket.destroy();
    });
    return new Promise((resolve, reject) => {
        server.close();
        server.unref();
        if (request.url && request.url.startsWith('/captcha?success')) {
            response.end('CAPTCHA validation was successful. Please close the browser and return to Visual Studio Code.');
            resolve();
        } else if (request.url && request.url.startsWith('/captcha?error')) {
            const errorMsg = '[Error]: Failed to validate the CAPTCHA with internal service error. Please try again later.';
            response.statusCode = 500;
            response.end(errorMsg);
            reject(errorMsg);
        } else if (request.url && request.url.startsWith('/captcha?vendorId')) {
            const errorMsg = '[Error]: The Vendor ID in the browser session does not match the one associated with your profile. \n'
                + 'Please sign into the correct developer account in your browser before completing the CAPTCHA.';
            response.statusCode = 400;
            response.end(errorMsg);
            reject(errorMsg);
        } else if (request.url && request.url.startsWith('/favicon.ico')) {
            request.destroy();
            response.statusCode = 204;
            response.end();
        } else {
            const errorMsg = '[Error]: Failed to validate the CAPTCHA. Please try again.';
            response.statusCode = 404;
            response.end(errorMsg);
            reject(errorMsg);
        }
    });
}

/**
 * Start a local server and listen the response from the captcha validation server,
 * then extract validation result from it.
 * @param PORT
 * @param captchaUrl
 */
function _listenResponseFromCaptchaServer(PORT: number): Promise<void> {
    Logger.verbose(`Calling method: _listenResponseFromCaptchaServer, args: `, PORT);
    return new Promise(async (resolve, reject) => {
        const server = await ServerFactory.getInstance();
        server.on('connection', (socket) => {
            socket.unref();
            return;
        });
        server.on('error', (error) => {
            throw loggableAskError(`Captcha server cannot be connected.`, error);
        });
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        server.on('request', async (request: IncomingMessage, response: ServerResponse) => {
            try {
                await _handleServerRequest(request, response, server);
                resolve();
            } catch (error) {
                Logger.error(`Captcha server request failed. ${error}`);
                reject(error);   
            }
        });
        server.listen(PORT);
    });
}

/**
 * Navigate user to the captcha validation page
 *
 * @param needBrowser
 * @param captchaUrl
 * @param vendorId
 */
export async function solveCaptcha(vendorId: string, captchaUrl: string): Promise<void> {
    Logger.verbose(`Calling method: solveCaptcha, args: `, vendorId, captchaUrl);
    await _openLoginUrlWithRedirectLink(captchaUrl, vendorId);
    await _listenResponseFromCaptchaServer(LOCALHOST_PORT);
}
