import * as vscode from 'vscode';

import { ServerFactory } from './serverFactory';
import { IncomingMessage, ServerResponse, Server } from 'http';
import { createOAuth } from './oauthWrapper';
import { AuthorizationCode, OAuthClient, Token, AuthorizationTokenConfig } from 'simple-oauth2';
import { parse } from 'url';
import { ParsedUrlQuery } from 'querystring';

const SCOPES_SKILLS_READWRITE = 'alexa::ask:skills:readwrite';
const SCOPES_MODELS_READWRITE = 'alexa::ask:models:readwrite';
const SCOPES_SKILLS_TEST = 'alexa::ask:skills:test';
const SCOPES_CATALOG_READ = 'alexa::ask:catalogs:read';
const SCOPES_CATALOG_READWRITE = 'alexa::ask:catalogs:readwrite';
const SCOPES_SKILLS_DEBUG = 'alexa::ask:skills:debug';
const DEFAULT_SCOPES = `${SCOPES_SKILLS_READWRITE} ${SCOPES_MODELS_READWRITE} ${SCOPES_SKILLS_TEST} ${SCOPES_CATALOG_READ} ${SCOPES_CATALOG_READWRITE} ${SCOPES_SKILLS_DEBUG}`;
const DEFAULT_STATE = 'Ask-SkillModel-ReadWrite';

var server: Server;

/**
* Use LWA OAuth2 to retrieve access tokens.
* @param lwaOptions contains clientId, clientSecret, scopes and state
*/
export async function accessTokenGenerator(lwaOptions: any): Promise<Token> {
    const {
        clientId,
        clientSecret,
        lwaAuthorizeHost,
        lwaTokenHost,
        scopes = DEFAULT_SCOPES,
        state = DEFAULT_STATE
    } = lwaOptions;

    const OAuth: OAuthClient = createOAuth(clientId, clientSecret, lwaAuthorizeHost, lwaTokenHost);
    const SERVER_PORT = 9090;
    const localServerUrl = `http://127.0.0.1:${SERVER_PORT}/cb`;
    const authorizeUrl: string = OAuth.authorizationCode.authorizeURL({
        redirect_uri: localServerUrl,
        scope: scopes,
        state
    });

    // call LWA on behalf of the user
    await vscode.env.openExternal(vscode.Uri.parse(authorizeUrl));

    const authCode: string = await _listenResponseFromLWA(SERVER_PORT);
    if (authCode) {
        const token: Token = await _requestTokens(authCode, localServerUrl, OAuth);  
        return token; 
    }              
    throw new Error('Auth code not returned from LWA');
}

/**
* Use the auth code to retrieve access token and other associated info from LWA.
* @param authCode
* @param redirect_uri
* @param OAuth
* @private
*/
export async function _requestTokens(authCode: AuthorizationCode, redirect_uri: string, OAuth: OAuthClient): Promise<Token> {
    const tokenConfig: AuthorizationTokenConfig = {
        code: authCode,
        redirect_uri: redirect_uri
    };
    try {
        const result: Token = await OAuth.authorizationCode.getToken(tokenConfig, {json: 'force'});
        return OAuth.accessToken.create(result).token;
    } catch (err) {
        throw new Error('Cannot obtain access token. ' + err);
    }
}

/**
* Start a local server and listen the response from LWA,
* then extract authorization code from it.
* @param PORT
* @param OAuth
* @private
*/
export async function _listenResponseFromLWA(PORT: number): Promise<string> {
    return new Promise<string>(async resolve => {
        server = await ServerFactory.getInstance();
        server.on('connection', (socket) => {
            socket.unref();
            return;
        });
        server.on('error', (error) => {
            throw new Error(error.message);
        });
        server.on('request', async (request: IncomingMessage, response: ServerResponse) => {
            const authCode: string = await _handleServerRequest(request, response, server);
            resolve(authCode);
        });
        server.listen(PORT);
    });
}

async function _handleServerRequest(request: IncomingMessage, response: ServerResponse, server: Server): Promise<string> {
    response.on('close', () => {
        request.socket.destroy();
    });
    return new Promise<string>(resolve => {
        if (request.url) {
            const requestQuery: ParsedUrlQuery = parse(request.url, true).query;
            server.close();
            server.unref();
            if (request.url.startsWith('/cb?code')) {
                response.writeHead(200, {"Content-Type": "text/html"});
                response.write(`<html>
                                    <head>
                                        <title>Sign in successful!</title>
                                        <link rel="stylesheet" itemprop="url"
                                        href="https://m.media-amazon.com/images/G/01/ASK/rosie-v2/css/bootstrap.min._CB472035751_.css"/>
                                        <style>
                                            body {
                                                text-align: center;
                                            }
                                            .heading {
                                                background-color: #162A38;
                                            }
                                        </style>
                                    </head>
                                    <body>
                                        <p class="heading">
                                            <img src="https://d34a6e1u0y0eo2.cloudfront.net/media/images/alexa.png"/>
                                            <h1>Sign in successful.</h1>
                                            You may now close this page and return to VSCode.
                                        </p>
                                    </body>
                                </html>`);
                response.end();
                const authCode: AuthorizationCode = requestQuery.code as AuthorizationCode;
                resolve(authCode);
            } else if (request.url.startsWith('/cb?error')) {
                response.statusCode = 403;
                response.end(`Error: ${requestQuery.error}\nError description: ${requestQuery.error_description}`);
                throw new Error('Access not granted. Please verify your account credentials are correct.\nIf this is your first time getting the error, '
                + 'please retry "ask init" to ensure any browser-cached tokens are refreshed.');
            }
        }
    });
}