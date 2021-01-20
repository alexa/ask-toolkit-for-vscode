import axios, { AxiosInstance } from 'axios';
import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as retry from 'async-retry'; 
import { HttpClient } from 'typed-rest-client/HttpClient';
import { 
    SmapiClientFactory, Utils
} from '../runtime';
import * as model from 'ask-smapi-model';

import ExportResponse = model.v1.skill.ExportResponse;
import UploadResponse = model.v1.skill.UploadResponse;
import ImportResponse = model.v1.skill.ImportResponse;
import ApiResponse = model.runtime.ApiResponse;
import { SKILL_FOLDER, SKILL, DEFAULT_PROFILE } from '../constants';
import { unzipFile } from './zipHelper';
import { AskError, loggableAskError } from '../exceptions';
import { Logger } from '../logger';
import { resolveUserAgent } from '../utils/httpHelper';
import { getSkillMetadataSrc } from '../utils/skillHelper';
import { isNonEmptyString } from '../runtime/lib/utils/stringUtils';
import { createZipFile } from '../utils/zipHelper';

export async function downloadSkillPackage(
    remoteLocation: string,
    destFolder: string,
    overWrite = true
): Promise<string> {
    Logger.verbose(`Calling method: downloadSkillPackage, args:`, remoteLocation, destFolder, overWrite);
    try {
        const client = new HttpClient("askToolkit");
        const response = await client.get(remoteLocation);
        const destPath = path.join(destFolder, "skillPackage.zip");

        if (fs.existsSync(destPath)) {
            if (overWrite) {
                fs.unlinkSync(destPath);
            } else {
                throw loggableAskError(`${destPath} already exists!!`);
            }
        }

        const skillPkgZipFile: NodeJS.WritableStream = fs.createWriteStream(destPath);

        if (response.message.statusCode !== 200) {
            throw loggableAskError(`HTTP request failure ${response.message}`);
        }

        // eslint-disable-next-line no-undef
        return new Promise((resolve, reject) => {
            skillPkgZipFile.on("error", err => reject(err));
            const stream = response.message.pipe(skillPkgZipFile);
            stream.on("close", () => {
                try {
                    resolve(destPath);
                } catch (err) {
                    reject(err);
                }
            });
        });
    } catch (err) {
        throw loggableAskError(`Skill package download failed.`, err);
    }
}

export function createSkillPackageFolder(skillFolder: string): void {
    Logger.verbose(`Calling method: createSkillPackageFolder, args:`, skillFolder);
    try {
        const skillPkgFolderPath = path.join(skillFolder, SKILL_FOLDER.SKILL_PACKAGE.NAME);

        if (!fs.existsSync(skillPkgFolderPath)) {
            fs.mkdirSync(skillPkgFolderPath);
        }

        const modelsPath = path.join(skillFolder, SKILL_FOLDER.MODELS);
        const skillJsonPath = path.join(skillFolder, SKILL_FOLDER.SKILL_MANIFEST);
        const ispsPath = path.join(skillFolder, SKILL_FOLDER.ISPS);
        const doModelsExist = fs.existsSync(modelsPath);
        const doSkillJsonExist = fs.existsSync(skillJsonPath);
        const doIspsExist = fs.existsSync(ispsPath);
        if (doModelsExist) {
            fs.moveSync(modelsPath, path.join(skillFolder, SKILL_FOLDER.SKILL_PACKAGE.CUSTOM_MODELS));
        }
        if (doSkillJsonExist) {
            fs.moveSync(skillJsonPath, path.join(skillFolder, SKILL_FOLDER.SKILL_PACKAGE.MANIFEST));
        }
        if (doIspsExist) {
            fs.moveSync(skillJsonPath, path.join(skillFolder, SKILL_FOLDER.SKILL_PACKAGE.ISPS));
        }
    } catch (err) {
        throw loggableAskError(`Create skill package folder failed`, err);
    }
}

async function pollExportStatus(exportId: string, context: vscode.ExtensionContext): Promise<ExportResponse> {
    Logger.verbose(`Calling method: pollExportStatus, args:`, exportId);
    
    // These numbers are taken from CLI.
    const retryOptions: retry.Options = {
        retries: 30,
        minTimeout: 2000,
        factor: 1.1,
    };

    let profile = Utils.getCachedProfile(context);
    profile = profile ?? DEFAULT_PROFILE;
    const smapiClient = SmapiClientFactory.getInstance(profile, context);

    const skillStatus = await retry(async (bail: (err: Error) => void): Promise<ExportResponse> => {
        const exportStatus = await smapiClient.getStatusOfExportRequestV1(exportId);

        if (exportStatus.status === SKILL.PACKAGE_STATUS.FAILED) {
            bail(new AskError("Get export skill package status failed"));
            return exportStatus;
        } else if (exportStatus.status === SKILL.PACKAGE_STATUS.SUCCEEDED) {
            return exportStatus;
        }
        throw loggableAskError("Skill package export in progress");
    }, retryOptions);

    return skillStatus;
}

export async function syncSkillPackage(
    skillPackageFolder: string, skillId: string, 
    context: vscode.ExtensionContext,
    stage = SKILL.STAGE.DEVELOPMENT): Promise<ExportResponse> {
    Logger.verbose(`Calling method: syncSkillPackage, args:`, skillPackageFolder, skillId);
    try {
        const skillPackageStatus = await getSkillPackageStatus(context, skillId, stage);
        const skillPkgRemoteLocation = skillPackageStatus.skill?.location;
        const skillPkgZipLocation = await downloadSkillPackage(skillPkgRemoteLocation!, skillPackageFolder);
        unzipFile(skillPkgZipLocation, skillPackageFolder);
        return skillPackageStatus;
    } catch (err) {
        throw loggableAskError(`Sync skill package failed, with error:`, err);
    }
}

export async function getSkillPackageStatus(
    context: vscode.ExtensionContext, skillId: string, stage = SKILL.STAGE.DEVELOPMENT): Promise<ExportResponse> {
    Logger.verbose(`Calling method: getSkillPackageStatus, args: `, skillId, stage);   
    try {
        let profile = Utils.getCachedProfile(context);
        profile = profile ?? DEFAULT_PROFILE;
        const smapiClient = SmapiClientFactory.getInstance(profile, context);
        const exportResponse = await smapiClient.callCreateExportRequestForSkillV1(skillId, stage);

        let exportId = exportResponse.headers.find(value => value.key === "location")?.value;
        // Get the exact exportId from the Url
        exportId = exportId?.substring(exportId?.lastIndexOf("/") + 1);
        if (exportId === undefined) {
            throw new AskError('Failed to fetch export Id. Please try it again later.')
        }
        return await pollExportStatus(exportId, context);
    } catch (err) {
        throw loggableAskError(`Get skill package remote location failed, with error:`, err);
    }
}

export async function getSkillPkgZipLocation(
    skillPackageFolder: string,
    skillId: string,
    context: vscode.ExtensionContext,
    stage = SKILL.STAGE.DEVELOPMENT
): Promise<string> {
    Logger.verbose(`Calling method: getSkillPkgZipLocation, args:`, skillPackageFolder, skillId);
    try {
        const skillPackageStatus = await getSkillPackageStatus(context, skillId, stage);
        const skillPkgRemoteLocation = skillPackageStatus.skill?.location;
        return await downloadSkillPackage(skillPkgRemoteLocation!, skillPackageFolder);
    } catch (err) {
        throw loggableAskError(`Download skill package failed, with error:`, err);
    }
}

export async function createUploadUrl(context: vscode.ExtensionContext): Promise<UploadResponse> {
    Logger.verbose(`Calling method: createUploadUrl`);
    try {
        let profile = Utils.getCachedProfile(context);
        profile = profile ?? DEFAULT_PROFILE;
        const smapiClient = SmapiClientFactory.getInstance(profile, context);
        return await smapiClient.createUploadUrlV1();
    } catch (error) {
        throw loggableAskError(`create skill package failed, with error:`, error);
    }    
}

export async function createSkillPackage(context: vscode.ExtensionContext, location: string, vendorId: string) {
    Logger.verbose(`Calling method: importSkillPackage, args:`, location, vendorId);
    try {
        let profile = Utils.getCachedProfile(context);
        profile = profile ?? DEFAULT_PROFILE;
        const smapiClient = SmapiClientFactory.getInstance(profile, context);
        return smapiClient.callCreateSkillPackageV1({location, vendorId});
    } catch (error) {
        throw loggableAskError(`create skill package failed, with error:`, error);
    }
}

export async function importSkillPackage(
    context: vscode.ExtensionContext, location: string, skillId: string, etag?: string): Promise<ApiResponse> {
    Logger.verbose(`Calling method: importSkillPackage, args:`, location, skillId, etag);
    try {
        let profile = Utils.getCachedProfile(context);
        profile = profile ?? DEFAULT_PROFILE;
        const smapiClient = SmapiClientFactory.getInstance(profile, context);
        return await smapiClient.callImportSkillPackageV1({ location }, skillId, etag);
    } catch (error) {
        throw loggableAskError(`Import skill package failed, with error:`, error);
    }
}

export async function deploySkillPackage(
    context: vscode.ExtensionContext, folderPath: string, skillId?: string, etag?: string ): Promise<string> {
    Logger.verbose(`Calling method: deploySkillPackage, args:`, folderPath, skillId, etag);
    try {
        const profile = Utils.getCachedProfile(context) ?? DEFAULT_PROFILE;
        const { skillPackageAbsPath } = getSkillMetadataSrc(folderPath, profile);
        const uploadUrlInfo = await createUploadUrl(context);
        const uploadUrl = uploadUrlInfo.uploadUrl as string;
        const zipFilePath = createZipFile(skillPackageAbsPath, folderPath);
        const uploadPayload = fs.readFileSync(zipFilePath);

        await uploadSkillPackage(uploadUrl, uploadPayload);
        fs.removeSync(zipFilePath);
        let importResponse: ApiResponse;
        if (skillId === undefined) {
            const vendorId = Utils.resolveVendorId(profile);
            importResponse = await createSkillPackage(context, uploadUrl, vendorId);
        } else {
            importResponse = await importSkillPackage(context, uploadUrl, skillId, etag);
        }
        const location = importResponse.headers.find(value => value.key === 'location');
        if (location === undefined) {
            throw new AskError("location is not found in the header of the import skill package response")
        }
        return path.basename(location.value);
    } catch (error) {
        throw loggableAskError(`Upload skill package failed, with error:`, error);
    }    
}

async function uploadSkillPackage(url: string, uploadPayload: any): Promise<any> {
    Logger.verbose(`Calling method: uploadSkillPackage, args:`, url, uploadPayload);
    const userAgentStr = resolveUserAgent();

    const httpClient: AxiosInstance = axios.create({timeout: 3000, headers: {"User-Agent": userAgentStr}});

    return httpClient.put(url, uploadPayload)
        .then((response) => {
            return response;
        })
        .catch((error) => {
            throw error.message;
        });
}

export async function pollImportStatus(
    importId: string, context: vscode.ExtensionContext): Promise<ImportResponse | undefined> {
    Logger.verbose(`Calling method: pollImportStatus, args:`, importId);
    
    const retryOptions: retry.Options = {
        retries: 30,
        minTimeout: 2000,
        factor: 1.1
    };

    let profile = Utils.getCachedProfile(context);
    profile = profile ?? DEFAULT_PROFILE;
    const smapiClient = SmapiClientFactory.getInstance(profile, context);

    return retry(async (bail: (err: Error) => void): Promise<ImportResponse | undefined> => {
        const importStatus = await smapiClient.getImportStatusV1(importId);
        if (importStatus.status === SKILL.PACKAGE_STATUS.FAILED) {
            let errorsMessage = "";
            const resources = importStatus.skill?.resources;
            resources?.forEach((resource) => {
                const errors = resource.errors;
                errors?.forEach((error) => {
                    if (error.message !== undefined) {
                        errorsMessage += `${error.message} `;
                    }
                });
            });
            const askError = new AskError("Skill package import failed" + (isNonEmptyString(errorsMessage) ? `. ${errorsMessage}` : ""));
            bail(askError);
            return;
        } else if (importStatus.status === SKILL.PACKAGE_STATUS.SUCCEEDED) {
            return importStatus;
        }
        const inProgressdMsg = 'Skill package import in progress';
        Logger.verbose(inProgressdMsg);
        throw new AskError(inProgressdMsg);
    }, retryOptions);
}
