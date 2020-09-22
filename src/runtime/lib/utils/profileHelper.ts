import * as vscode from 'vscode';

import { read, deleteProperty, getProperty, writeToProperty } from './jsonUtility';
import { homedir } from 'os';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { writeFileSync } from 'jsonfile';
import { Hash } from 'crypto';
import { isTokenExpired, refreshToken } from './oauthWrapper';
import { AUTH, EXTENSION_STATE_KEY, CONFIGURATION, FILE_PATH } from './constants';
import { SmapiClientFactory } from '../smapiClientFactory';
import * as model from 'ask-smapi-model';
import { Logger } from '../../../logger';

export function listExistingProfileNames(): string[]|null {
    const askConfig: string = join(
        homedir(), FILE_PATH.ASK.HIDDEN_FOLDER, FILE_PATH.ASK.PROFILE_FILE);
    if (!existsSync(askConfig)) {
        return null;
    }
    const { profiles }: any = read(askConfig);
    if (profiles === undefined || Object.keys(profiles).length === 0) {
        return null;
    }
    const profileNames: string[] = [];
    for (const profile of Object.getOwnPropertyNames(profiles)) {
        profileNames.push(profile);
    }
    return profileNames;
}

export function createConfigFileIfNotExists(): void {
    const askConfig: string = join(
        homedir(), FILE_PATH.ASK.HIDDEN_FOLDER, FILE_PATH.ASK.PROFILE_FILE);
    if (!existsSync(askConfig)) {
        const askFolder: string = join(homedir(), FILE_PATH.ASK.HIDDEN_FOLDER);
        if (!existsSync(askFolder)) {
            mkdirSync(askFolder);
        }
        writeFileSync(
            askConfig, 
            { profiles: {} }, 
            { 
                spaces: CONFIGURATION.JSON_DISPLAY_INTENT, 
                mode: CONFIGURATION.FILE_PERMISSION.USER_READ_WRITE 
            });
    }
}

export function getProfileInfo(profile: string): Hash | null {
    const askConfig = join(
        homedir(), FILE_PATH.ASK.HIDDEN_FOLDER, FILE_PATH.ASK.PROFILE_FILE);
    if (!existsSync(askConfig)) {
        return null;
    }
    const { profiles } = read(askConfig);
    if (profiles === undefined || Object.keys(profiles).length === 0 || !Object.prototype.hasOwnProperty.call(profiles, profile)) {
        return null;
    }
    return profiles[profile] as Hash;
}

export async function isProfileAuth(context: vscode.ExtensionContext): Promise<boolean> {

    const profileName: string | undefined = context.globalState.get(EXTENSION_STATE_KEY.LWA_PROFILE);
    try {
        if (profileName !== undefined && getProfileInfo(profileName) !== null) {
            if (isTokenExpired(profileName)) {
                await refreshToken(profileName);
            }
            return true;
        }
    } catch (err) {
        Logger.info(`${profileName} profile is unauthorized`, err);
    }
    return false;
}

export function deleteProfile(profileName: string): boolean {
    const askConfig: string = join(
        homedir(), FILE_PATH.ASK.HIDDEN_FOLDER, FILE_PATH.ASK.PROFILE_FILE);
    if (!existsSync(askConfig)) {
        return false;
    }
    return deleteProperty(askConfig, ['profiles', profileName]);
}

export async function setVendorId(profile: string, context: vscode.ExtensionContext): Promise<boolean> {
    const vendors: model.v1.vendorManagement.Vendors = await SmapiClientFactory.getInstance(profile, context).getVendorListV1();
    const configPath = join(
        homedir(), FILE_PATH.ASK.HIDDEN_FOLDER, FILE_PATH.ASK.PROFILE_FILE);
    const propertyPathArray = ['profiles', profile, 'vendor_id'];
    if (vendors.vendors && vendors.vendors.length > 0) {
        const selectedVendor = vendors.vendors.length > 1 ? await selectVendorId(vendors.vendors) : vendors.vendors[0].id;
        writeToProperty(configPath, propertyPathArray, selectedVendor);
        return true;
    }
    return false;
}

function selectVendorId(vendors: model.v1.vendorManagement.Vendor[]): Promise<string> {
    return new Promise((resolve) => {
        const vendorQp = vscode.window.createQuickPick();
        vendorQp.title = 'Select which vendor ID to use with this account';
        vendorQp.canSelectMany = false;
        vendorQp.matchOnDescription = true;

        vendorQp.onDidChangeValue(() => {
            vendorQp.activeItems = [];
        });

        vendorQp.onDidAccept(() => {
            if (vendorQp.activeItems.length !== 0) {
                vendorQp.ignoreFocusOut = false;
                const selectedVendor: string = vendorQp.activeItems[0].label;
                vendorQp.dispose();
                resolve(selectedVendor);
            }
        });

        vendorQp.onDidHide(() => {
            vendorQp.items = qpItems;
            vendorQp.show();
        });

        vendorQp.ignoreFocusOut = true;
        const qpItems: vscode.QuickPickItem[] = new Array<vscode.QuickPickItem>();
        vendors.forEach(vendor => {
            qpItems.push({
                label: vendor.id as string,
                description: `${vendor.name} - ${vendor.roles}`
            });
        });
        vendorQp.items = qpItems;
        vendorQp.enabled = true;
        vendorQp.show();
    });
}

export function resolveVendorId(profileName: string): string {
    let vendorId: string;
    if (profileName === AUTH.PLACEHOLDER_ENVIRONMENT_VAR_PROFILE_NAME) {
        if (process.env.ASK_VENDOR_ID === undefined) {
            throw new Error('Please make sure env var ASK_VENDOR_ID is defined.');
        }
        vendorId = process.env.ASK_VENDOR_ID;

    } else {
        const askConfig: string = join(
            homedir(), FILE_PATH.ASK.HIDDEN_FOLDER, FILE_PATH.ASK.PROFILE_FILE);
        if (existsSync(askConfig)) {
            vendorId = getProperty(askConfig, ['profiles', profileName, 'vendor_id']);
        } else {
            throw new Error(`Please make sure ${askConfig} exists.`);
        }
    }
    return vendorId;
}

export function getCachedProfile(context: vscode.ExtensionContext): string | undefined {
    return context.globalState.get(EXTENSION_STATE_KEY.LWA_PROFILE);
}