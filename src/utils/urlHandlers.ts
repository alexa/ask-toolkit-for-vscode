import * as fs from 'fs-extra';
import * as https from 'https';
import * as vscode from 'vscode';
import { parse } from 'querystring';
import * as model from 'ask-smapi-model';
import SkillSummary = model.v1.skill.SkillSummary;
import HostedSkillMetadata = model.v1.skill.AlexaHosted.HostedSkillMetadata;
import ListSkillResponse = model.v1.skill.ListSkillResponse;

import { SkillInfo } from '../models/types';
import { DEFAULT_PROFILE } from '../constants';
import { Utils, SmapiResource, SmapiClientFactory } from '../runtime';
import { Logger } from '../logger';
import { loggableAskError } from '../exceptions';

export async function hostedSkillsClone(uri: vscode.Uri, context: vscode.ExtensionContext) {
    if (uri.path === '/clone') {
        const queryData = parse(uri.query);
        const targetSkillId = queryData.skillId as string;
        const targetVendorId = queryData.vendorId as string;

        let profile = Utils.getCachedProfile(context);
        profile = profile ?? DEFAULT_PROFILE;
        let vendorId: string;
        try {
            vendorId = Utils.resolveVendorId(profile);
        } catch (err) {
            throw loggableAskError(`Failed to retrieve vendorID for profile ${profile}`, err, true);
        }   
        if (vendorId !== targetVendorId) {
            const VENDOR_ID_MISMATCH = `Unable to clone: vendor ID for requested skill ${targetVendorId} \
            does not match current profile vendor ID ${vendorId}. \
            Switch to the correct profile or log in to the corresponding account.`;
            Logger.error(VENDOR_ID_MISMATCH);
            vscode.window.showErrorMessage(VENDOR_ID_MISMATCH);
            return;
        }
        const smapiClient = SmapiClientFactory.getInstance(profile, context);
        let hostedSkillMetadata: HostedSkillMetadata;
        try {
            hostedSkillMetadata = await smapiClient.getAlexaHostedSkillMetadataV1(targetSkillId);
        } catch (err) {
            const NON_HOSTED_SKILL = 'Unable to clone: target skill is not a hosted skill';
            vscode.window.showErrorMessage(NON_HOSTED_SKILL);
            Logger.error(NON_HOSTED_SKILL, err);
            return;
        }

        const listSkills: ListSkillResponse = await smapiClient.listSkillsForVendorV1(
            targetVendorId, undefined, undefined, [targetSkillId]);
        if (listSkills) {
            const targetSkill: SkillSummary  = listSkills.skills![0];
            if (targetSkill) {
                vscode.commands.executeCommand(
                    'askContainer.skillsConsole.cloneSkillFromConsole', new SmapiResource<SkillInfo>(
                        new SkillInfo(targetSkill, true, hostedSkillMetadata), targetSkillId));
                return;
            }
        }
        const INVALID_SKILL = 'Unable to clone: could not find target skill in account';
        vscode.window.showErrorMessage(INVALID_SKILL);
        Logger.error(INVALID_SKILL);
    } else {
        const UNSUPPORTED_URI = `Unsupported extension launch URI: ${uri}`;
        throw loggableAskError(UNSUPPORTED_URI);
    }
}

export async function downloadToFileFromUrl(filePath: string, url: string, mode: string | number): Promise<void> {
    Logger.verbose(`Calling method: downloadToFileFromUrl, args: `, filePath, url);
    const file = fs.createWriteStream(filePath);
    return new Promise((resolve, reject) => {
        const request = https.get(url, resp => {
            resp.pipe(file);
            file.on('finish', () => {
                fs.chmodSync(filePath, mode);
                resolve();
            });
        });
        request.on('error', err => {
            Logger.error(`Failed to download a file from the url: ${url}.`);
            reject();
        });
        request.end();
    });
}