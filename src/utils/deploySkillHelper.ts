import * as vscode from 'vscode';
import * as fs from 'fs';
import * as model from 'ask-smapi-model';
import * as path from 'path';
import * as retry from 'async-retry';
import { view, lensPath } from 'ramda';

import { 
    SmapiClientFactory, Utils, AbstractWebView
} from '../runtime';

import ListCertificationsResponse = model.v1.skill.certification.ListCertificationsResponse;
import SmapiClient = model.services.skillManagement.SkillManagementServiceClient;
import StandardizedError = model.v1.skill.StandardizedError;

import { Repository, GitErrorCodes } from '../@types/git';
import { loggableAskError, AskError } from '../exceptions';
import { getSkillDetailsFromWorkspace } from './skillHelper';
import { getOrInstantiateGitApi } from './gitHelper';
import { BRANCH_TO_STAGE, DEFAULT_PROFILE } from '../constants';
import { Logger } from '../logger';
import { SKILL } from '../constants';


function checkValidBranch(branchName: string): void { 
    Logger.verbose(`Calling method: checkValidBranch, args:`, branchName);
    if (!(branchName in BRANCH_TO_STAGE)) {
        throw loggableAskError(`Hosted skills cannot be deployed through ${branchName} branch. Please merge your branch into remote master branch`);
    }
}

async function checkValidStage(branchName: string, skillId: string,
    smapiClient: model.services.skillManagement.SkillManagementServiceClient): Promise<void> {
    Logger.verbose(`Calling method: callValidStage, args:`, branchName, skillId);
    const skillStage: string = BRANCH_TO_STAGE[branchName];
    if (!skillStage) {
        throw loggableAskError(`No skill stage available for ${branchName} branch`);
    }

    try { 
        await smapiClient.getSkillManifestV1(skillId, skillStage);
    } catch (err) {
        throw loggableAskError(`Expected stage ${skillStage} doesn't exist for ${branchName}`);
    }
}

async function checkInProgressCerts(
    skillId: string, nextToken: string | undefined, smapiClient: model.services.skillManagement.SkillManagementServiceClient): Promise<void> {
    Logger.verbose(`Calling method: checkInProgressCerts, args:`, skillId, nextToken);
    let certificationListResponse: ListCertificationsResponse;
    try {
        certificationListResponse = await smapiClient.getCertificationsListV1(skillId, nextToken);
    } catch (err) {
        if (err.name === 'ServiceError' && err.statusCode === 404) {
            // skill never sent for certification
            return;
        }
        throw loggableAskError(`Couldn't check certification status for skill. ${err}`);
    }

    if (certificationListResponse.items?.some(
        (certSummary) => certSummary.status === 'IN_PROGRESS')) {
        throw loggableAskError(
            `Your skill is in review. If you want to make any changes to the code, withdraw the skill from certification or publish to live.`);
    } else {
        if (certificationListResponse.isTruncated) {
            const nextToken = certificationListResponse.nextToken;
            return await checkInProgressCerts(skillId, nextToken, smapiClient);
        }
        return;
    }
}

async function getGitCredsAndPush(
    gitRepo: Repository, skillId: string, skillFolderUri: vscode.Uri,
    smapiClient: model.services.skillManagement.SkillManagementServiceClient): Promise<void> {
    Logger.verbose('Calling method: getGitCredsAndPush, args:', gitRepo.state.HEAD, skillId);
    await gitRepo.push();
}

type SkillBuildResponseType = {
    hostedSkillDeployment: {
        status: string;
        errors?: StandardizedError;
    },
    manifest: {
        status: string;
        errors?: StandardizedError;
    },
    interactionModel: {
        status: string;
        errors?: StandardizedError;
    }
};

async function pollSkillBuildStatus(
    skillId: string, commitId: string, smapiClient: model.services.skillManagement.SkillManagementServiceClient): Promise<SkillBuildResponseType | undefined> {
    // The maximum waiting time:
    // Math.min(minTimeout * Math.pow(1.2, 30), maxTimeout) ~= 8min
    // which is the same with create self hosted skill.
    const retryOptions: retry.Options = {
        retries: 30,
        minTimeout: 2000,
        factor: 1.2
    };
    const response: SkillBuildResponseType = {
        hostedSkillDeployment: {
            status: ''
        },
        manifest: {
            status: ''
        },
        interactionModel: {
            status: ''
        }
    };

    return await retry(async (bail: (err: Error) => void, attempt: number) => {
        Logger.verbose(`Retrying skill build status polling, attempt: ${attempt}`);
        const skillStatus: any = await smapiClient.getSkillStatusV1(skillId);
        const SKILL_BUILD_FAILED = 'Hosted skill deployment failed';
        let buildDetails;
        let skillBuildMsg;

        const currentCommitId = skillStatus.hostedSkillDeployment?.lastUpdateRequest?.deploymentDetails?.commitId;
        if (currentCommitId !== commitId) {
            skillBuildMsg = 'Commit not yet pushed to skill build. Retrying after timeout';
            Logger.verbose(skillBuildMsg);
            throw new AskError(skillBuildMsg);
        }
        response.hostedSkillDeployment.status = view(lensPath([SKILL.RESOURCES.HOSTED_SKILL_DEPLOYMENT,
            'lastUpdateRequest', 'status']), skillStatus);
        response.hostedSkillDeployment.errors = view(lensPath([SKILL.RESOURCES.HOSTED_SKILL_DEPLOYMENT,
            'lastUpdateRequest', 'errors']), skillStatus);
        
        if (response.hostedSkillDeployment.status === SKILL.HOSTED_DEPLOYMENT_STATUS.FAILURE) {
            Logger.verbose(`Skill status response: ${JSON.stringify(response)}`);
            Logger.verbose('Hosted skill commit lead to skill build failure. Bailing out');
            bail(new AskError(SKILL_BUILD_FAILED));
            return;
        } else if (response.hostedSkillDeployment.status === SKILL.HOSTED_DEPLOYMENT_STATUS.IN_PROGRESS) {
            skillBuildMsg = 'Skill build in progress. Retrying after timeout';
            Logger.verbose(skillBuildMsg);
            throw new AskError(skillBuildMsg);
        }

        response.manifest.status = view(lensPath([SKILL.RESOURCES.MANIFEST,
            'lastUpdateRequest', 'status']), skillStatus);
        response.manifest.errors = view(lensPath([SKILL.RESOURCES.MANIFEST,
            'lastUpdateRequest', 'errors']), skillStatus);

        if (skillStatus[SKILL.RESOURCES.INTERACTION_MODEL]) {
            const locale = Object.keys(skillStatus[SKILL.RESOURCES.INTERACTION_MODEL])[0];
            response.interactionModel.status = view(lensPath([SKILL.RESOURCES.INTERACTION_MODEL,
                locale, 'lastUpdateRequest', 'status']), skillStatus);
            response.interactionModel.errors = view(lensPath([SKILL.RESOURCES.INTERACTION_MODEL,
                locale, 'lastUpdateRequest', 'errors']), skillStatus);
            buildDetails = view(lensPath([SKILL.RESOURCES.INTERACTION_MODEL, locale,
                'lastUpdateRequest', 'buildDetails']), skillStatus);
        }

        if (!response.manifest.status && !response.interactionModel.status) {
            skillBuildMsg = 'Internal error with the service';
            Logger.verbose(skillBuildMsg);
            bail(new AskError(skillBuildMsg));
            return;
        }
        
        if (response.manifest.status === SKILL.MANIFEST_STATUS.FAILURE
            || (response.interactionModel.status === SKILL.INTERACTION_MODEL_STATUS.FAILURE 
                && buildDetails)) {
            Logger.verbose(`Skill status response: ${JSON.stringify(response)}`);
            Logger.verbose('Skill build failure. Bailing out');
            bail(new AskError(SKILL_BUILD_FAILED));
            return;
        }

        if (response.manifest.status === SKILL.MANIFEST_STATUS.SUCCESS 
            && response.interactionModel.status === SKILL.INTERACTION_MODEL_STATUS.SUCCESS) {
            return response;
        } else {
            const skillBuildMsg = 'Skill build in progress. Retrying after timeout';
            Logger.verbose(skillBuildMsg);
            throw new AskError(skillBuildMsg);
        }
    }, retryOptions);
}

export async function deploySkill(
    skillFolderWs: vscode.Uri, context: vscode.ExtensionContext, view: AbstractWebView): Promise<void> {
    Logger.verbose('Calling method: deploySkill');
    try {
        let profile = Utils.getCachedProfile(context);
        profile = profile ?? DEFAULT_PROFILE;
        const smapiClient: SmapiClient = SmapiClientFactory.getInstance(profile, context);

        const gitApi = await getOrInstantiateGitApi(context);
        const skillRepo = gitApi?.getRepository(skillFolderWs);
        const skillId = getSkillDetailsFromWorkspace(context).skillId;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Deploying skill",
            cancellable: false
        }, async (progress, token) => {
            const headBranch = skillRepo?.state.HEAD?.name;
            if (headBranch === undefined) {
                throw new Error(`${skillFolderWs.fsPath} not a git repository. Cannot deploy non-hosted skills.`);
            }
            
            checkValidBranch(headBranch);
            await checkValidStage(headBranch, skillId, smapiClient);

            await checkInProgressCerts(skillId, undefined, smapiClient);
            
            await getGitCredsAndPush(skillRepo!, skillId, skillFolderWs, smapiClient);
        });

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Deploying skill: Skill build in progress",
            cancellable: false
        }, async (progress, token) => {
            const latestCommit = (await skillRepo?.log({maxEntries: 1}))![0];
            
            try {
                await pollSkillBuildStatus(
                    skillId, latestCommit.hash, smapiClient);
                const skillBuildStatusMsg = 'Skill build succeeded';
                Logger.info(skillBuildStatusMsg);
                vscode.window.showInformationMessage(skillBuildStatusMsg);
            } catch(err) {
                throw loggableAskError(`Skill build failed`, err, true);
            } finally {
                view.dispose();
            }
        });
    } catch (err) {
        throw loggableAskError(`Skill deploy failed`, err, true);
    }
}
