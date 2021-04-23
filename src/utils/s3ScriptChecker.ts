/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import * as md5 from 'md5-file';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import * as retry from 'async-retry';
import { homedir } from 'os';

import { SKILL, SKILL_FOLDER, SYSTEM_ASK_FOLDER } from '../constants';
import { Logger } from '../logger';
import { DynamicConfig } from './dynamicConfig';

const AUTH_INFO_LAST_UPDATE_TIME = 'authInfoLastUpdateTime';
const ASK_PRE_PUSH_LAST_UPDATE_TIME = 'askPrePushLastUpdateTime';
const GIT_CREDENTIAL_HELPER_LAST_UPDATE_TIME = 'gitCredentialHelperLastUpdateTime';
const AMAZONAWS_COM = 'amazonaws.com';

const HOUR = 3600000;
const MINUTE = 60000;
const NUMBER_OF_INTERVALS = 24;

// The maximum waiting time:
// Math.min(500 * Math.pow(1.1, 5), maxTimeout) ~= 0.85 secs
const RETRY_OPTION: retry.Options = {
    retries: 5,
    minTimeout: 5000,
    factor: 1.1
} 

export function checkAllSkillS3Scripts(context: vscode.ExtensionContext): void {
    void checkAuthInfoScript(context);
    void checkGitCredentialHelperScript(context);
    void checkAskPrePushScript(context);
}

export async function checkAuthInfoScript(context: vscode.ExtensionContext): Promise<void> {
    const authInfoUrl = DynamicConfig.s3Scripts.authInfo;
    const authInfoPath = path.join(homedir(), SKILL_FOLDER.HIDDEN_ASK_FOLDER, SYSTEM_ASK_FOLDER.AUTH_INFO);
    await checkScript(authInfoUrl, authInfoPath, context, AUTH_INFO_LAST_UPDATE_TIME, undefined);
}

export async function checkAskPrePushScript(context: vscode.ExtensionContext): Promise<void> {
    const askScriptUrl = DynamicConfig.s3Scripts.askPrePush;
    const scriptFolderPath = path.join(homedir(), SYSTEM_ASK_FOLDER.HIDDEN_ASK_FOLDER, SYSTEM_ASK_FOLDER.SCRIPTS_FOLDER.NAME);
    const askFilePath = path.join(
        homedir(), SYSTEM_ASK_FOLDER.HIDDEN_ASK_FOLDER, SYSTEM_ASK_FOLDER.SCRIPTS_FOLDER.NAME, SYSTEM_ASK_FOLDER.SCRIPTS_FOLDER.ASK_PRE_PUSH);
    if (!fs.existsSync(scriptFolderPath)) {
        fs.mkdirSync(scriptFolderPath);
    }
    const askChmod = SKILL.GIT_HOOKS_SCRIPTS.CHMOD;
    await checkScript(askScriptUrl, askFilePath, context, ASK_PRE_PUSH_LAST_UPDATE_TIME, askChmod);
}

export async function checkGitCredentialHelperScript(context: vscode.ExtensionContext): Promise<void> {
    const scriptUrl = DynamicConfig.s3Scripts.gitCredentialHelper;
    const scriptFolderPath = path.join(homedir(), SYSTEM_ASK_FOLDER.HIDDEN_ASK_FOLDER, SYSTEM_ASK_FOLDER.SCRIPTS_FOLDER.NAME);
    const filePath = path.join(
        homedir(), SYSTEM_ASK_FOLDER.HIDDEN_ASK_FOLDER, SYSTEM_ASK_FOLDER.SCRIPTS_FOLDER.NAME, SYSTEM_ASK_FOLDER.SCRIPTS_FOLDER.GIT_CREDENTIAL_HELPER);
    if (!fs.existsSync(scriptFolderPath)) {
        fs.mkdirSync(scriptFolderPath);
    }
    const chmod = SKILL.GIT_HOOKS_SCRIPTS.CHMOD;
    await checkScript(scriptUrl, filePath, context, GIT_CREDENTIAL_HELPER_LAST_UPDATE_TIME, chmod);
}

async function checkScript(
    scriptUrl: string, scriptPath: string, context: vscode.ExtensionContext, stateKey: string, chmod: string | undefined): Promise<void> {

    if (context.globalState.get(stateKey) === undefined || !fs.existsSync(scriptPath)) {
        const now = new Date().getTime();
        void context.globalState.update(stateKey, now);
        await downloadScriptFromS3(scriptUrl, scriptPath, chmod);
        return;
    }

    const now = new Date().getTime();
    const pre = context.globalState.get(stateKey) as number;
    const diff = Math.abs(now - pre) / HOUR;
    if (diff < NUMBER_OF_INTERVALS) {
        return;
    }
    void context.globalState.update(stateKey, now);
    if (!await isScriptUpdated(scriptUrl, scriptPath)) {
        return;
    }
    await downloadScriptFromS3(scriptUrl, scriptPath, chmod);
}

async function isScriptUpdated(
    scriptUrl: string, scriptPath: string): Promise<boolean> {
    
    const idx = scriptUrl.indexOf(AMAZONAWS_COM);
    if(!idx) {
        Logger.error(`'${scriptUrl}' is not a valid S3 object URL.`);
        return false;
    }

    const metadata = await retrieveMetadataOfS3Object(scriptUrl);
    if (!('etag' in metadata)) {
        Logger.error(`The script '${scriptUrl}' is not public yet.`);
        return false;
    }
    const remoteEtag = (metadata.etag as string).replace(/"/g, '');
    const localEtag = md5.sync(scriptPath);
    return remoteEtag !== localEtag;
}

async function retrieveMetadataOfS3Object(scriptUrl: string): Promise<any> {
    return retry(async  (bail: (err: Error) => void): Promise<any>  => {
        return new Promise((resolve, reject) => {
            const request = https.get(scriptUrl, { method: 'HEAD' }, (resp) => {
                resolve(resp.headers);
            });
            request.on('error', (err) => {
                reject(err);
            });
            request.end();
        });
    }, RETRY_OPTION);
}


async function downloadScriptFromS3(
    scriptUrl: string, filePath: string, chmod: string | undefined): Promise<void> {

    const file = fs.createWriteStream(filePath);
    return retry(async (bail: (err: Error) => void): Promise<void> => {
        return new Promise((resolve, reject) => {
            const request = https.get(scriptUrl, (resp) => {
                resp.pipe(file);
                if(chmod !== undefined){
                    fs.chmodSync(filePath, chmod);
                }
                resolve();
            });
            request.on('error', (err) => {
                reject(err);
            });
            request.end();
        });
    }, RETRY_OPTION);
}