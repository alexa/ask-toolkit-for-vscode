/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import { createServer, Server } from 'http';
import { checkPortStatus } from 'portscanner';

/**
 * Factory for localhost server instances used for LWA and CAPTCHA validation
 * responses.
 */
export class ServerFactory {

    private static server: Server;

    /**
     * Gets an instance of an HTTP server.
     * Currently locked to port 9090.
     */
    public static async getInstance(): Promise<Server> {
        if (this.server) {
            this.server.close();
        }
        const SERVER_PORT = 9090;
        const portStatus = await checkPortStatus(SERVER_PORT);
        if (portStatus === 'open') {
            throw new Error('LWA listening port already in use.');
        }
        this.server = createServer();
        return this.server; 
    }

}