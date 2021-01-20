import * as vscode from "vscode";
import * as model from "ask-smapi-model";
import * as retry from "async-retry";
import { view, lensPath } from "ramda";

import ListCertificationsResponse = model.v1.skill.certification.ListCertificationsResponse;
import StandardizedError = model.v1.skill.StandardizedError;

import { Repository } from "../../../@types/git";
import { loggableAskError, AskError } from "../../../exceptions";
import { getSkillPackageStatus } from "../../../utils/skillPackageHelper";
import { BRANCH_TO_STAGE, SKILL } from "../../../constants";
import { Logger } from "../../../logger";
import { SmapiClientFactory, AbstractWebView } from "../../../runtime";
import { isNonEmptyString } from '../../../runtime/lib/utils/stringUtils';
import { AbstractDeploySkillManager } from "./abstractDeploySkillManager";

const SKILL_BUILD_STATUS_SUCCEEDED_MSG = "Skill build succeeded";
const SKILL_BUILD_STATUS_FAILED_MSG = "Skill build failed";
const SKILL_DEPLOY_STATUS_FAILED_MSG = "Skill deploy failed";

type SkillBuildResponseType = {
    hostedSkillDeployment: {
        status: string;
        errors?: [StandardizedError];
    };
    manifest: {
        status: string;
        errors?: [StandardizedError];
    };
    interactionModel: {
        status: string;
        errors?: [StandardizedError];
    };
};

export class DeployHostedSkillManager extends AbstractDeploySkillManager {
    private smapiClient: model.services.skillManagement.SkillManagementServiceClient;
    private skillRepo: Repository;

    constructor(context: vscode.ExtensionContext, skillFolderWs: vscode.Uri, skillRepo: Repository) {
        super(context, skillFolderWs);
        this.smapiClient = SmapiClientFactory.getInstance(this.profile, context);
        this.skillRepo = skillRepo;
    }

    checkValidBranch(branchName: string): void {
        Logger.verbose(`Calling method: checkValidBranch, args:`, branchName);
        if (!(branchName in BRANCH_TO_STAGE)) {
            throw loggableAskError(
                `Hosted skills cannot be deployed through ${branchName} branch. Please merge your branch into remote master branch`
            );
        }
    }

    async checkValidStage(branchName: string): Promise<void> {
        Logger.verbose(`Calling method: callValidStage, args:`, branchName, this.skillId);
        const skillStage: string = BRANCH_TO_STAGE[branchName];
        if (!skillStage) {
            throw loggableAskError(`No skill stage available for ${branchName} branch. The current branch must be either master or prod.`);
        }

        try {
            await this.smapiClient.getSkillManifestV1(this.skillId, skillStage);
        } catch (err) {
            throw loggableAskError(err);
        }
    }

    async checkInProgressCerts(nextToken: string | undefined): Promise<void> {
        Logger.verbose(`Calling method: checkInProgressCerts, args:`, nextToken);
        let certificationListResponse: ListCertificationsResponse;
        try {
            certificationListResponse = await this.smapiClient.getCertificationsListV1(this.skillId, nextToken);
        } catch (err) {
            if (err.name === "ServiceError" && err.statusCode === 404) {
                // skill never sent for certification
                return;
            }
            throw loggableAskError(`Couldn't check certification status for skill. ${err}`);
        }

        if (certificationListResponse.items?.some(certSummary => certSummary.status === "IN_PROGRESS") === true) {
            throw loggableAskError(
                `Your skill is in review. If you want to make any changes to the code, withdraw the skill from certification or publish to live.`
            );
        } else {
            if (certificationListResponse.isTruncated === true) {
                const nextToken = certificationListResponse.nextToken;
                return this.checkInProgressCerts(nextToken);
            }
            return;
        }
    }

    async pollSkillBuildStatus(commitId: string): Promise<SkillBuildResponseType | undefined> {
        // The maximum waiting time:
        // Math.min(minTimeout * Math.pow(1.2, 30), maxTimeout) ~= 8min
        // which is the same with create self hosted skill.
        const retryOptions: retry.Options = {
            retries: 30,
            minTimeout: 2000,
            factor: 1.2,
        };
        const response: SkillBuildResponseType = {
            hostedSkillDeployment: {
                status: "",
            },
            manifest: {
                status: "",
            },
            interactionModel: {
                status: "",
            },
        };

        return retry(async (bail: (err: Error) => void, attempt: number) => {
            Logger.verbose(`Retrying skill build status polling, attempt: ${attempt}`);
            const skillStatus: any = await this.smapiClient.getSkillStatusV1(this.skillId);
            const SKILL_BUILD_FAILED = "Hosted skill deployment failed";
            let buildDetails;
            let skillBuildMsg;

            const currentCommitId = skillStatus.hostedSkillDeployment?.lastUpdateRequest?.deploymentDetails?.commitId;
            if (currentCommitId !== commitId) {
                skillBuildMsg = "Commit not yet pushed to skill build. Retrying after timeout";
                Logger.verbose(skillBuildMsg);
                throw new AskError(skillBuildMsg);
            }
            response.hostedSkillDeployment.status = view(
                lensPath([SKILL.RESOURCES.HOSTED_SKILL_DEPLOYMENT, "lastUpdateRequest", "status"]),
                skillStatus
            );
            response.hostedSkillDeployment.errors = view(
                lensPath([SKILL.RESOURCES.HOSTED_SKILL_DEPLOYMENT, "lastUpdateRequest", "errors"]),
                skillStatus
            );

            if (response.hostedSkillDeployment.status === SKILL.HOSTED_DEPLOYMENT_STATUS.FAILURE) {
                Logger.verbose(`Skill status response: ${JSON.stringify(response)}`);
                Logger.verbose("Hosted skill commit lead to skill build failure. Bailing out");
                const errors = response.hostedSkillDeployment.errors;
                let errorsMessage = "";
                if (errors !== undefined && errors.length > 0) {
                    errors.forEach((error) => {
                        if (error.message !== undefined) {
                            errorsMessage += `${error.message} `;
                        }
                    });
                }
                bail(new AskError( SKILL_BUILD_FAILED + (isNonEmptyString(errorsMessage) ? `. Reason: ${errorsMessage}` : "")));
                return;
            } else if (response.hostedSkillDeployment.status === SKILL.HOSTED_DEPLOYMENT_STATUS.IN_PROGRESS) {
                skillBuildMsg = "Skill build in progress. Retrying after timeout";
                Logger.verbose(skillBuildMsg);
                throw new AskError(skillBuildMsg);
            }

            response.manifest.status = view(
                lensPath([SKILL.RESOURCES.MANIFEST, "lastUpdateRequest", "status"]),
                skillStatus
            );
            response.manifest.errors = view(
                lensPath([SKILL.RESOURCES.MANIFEST, "lastUpdateRequest", "errors"]),
                skillStatus
            );

            if (skillStatus[SKILL.RESOURCES.INTERACTION_MODEL] !== undefined) {
                const locale = Object.keys(skillStatus[SKILL.RESOURCES.INTERACTION_MODEL])[0];
                response.interactionModel.status = view(
                    lensPath([SKILL.RESOURCES.INTERACTION_MODEL, locale, "lastUpdateRequest", "status"]),
                    skillStatus
                );
                response.interactionModel.errors = view(
                    lensPath([SKILL.RESOURCES.INTERACTION_MODEL, locale, "lastUpdateRequest", "errors"]),
                    skillStatus
                );
                buildDetails = view(
                    lensPath([SKILL.RESOURCES.INTERACTION_MODEL, locale, "lastUpdateRequest", "buildDetails"]),
                    skillStatus
                );
            }

            if (!response.manifest.status && !response.interactionModel.status) {
                skillBuildMsg = "Internal error with the service";
                Logger.verbose(skillBuildMsg);
                bail(new AskError(skillBuildMsg));
                return;
            }

            if (
                response.manifest.status === SKILL.MANIFEST_STATUS.FAILURE ||
                (response.interactionModel.status === SKILL.INTERACTION_MODEL_STATUS.FAILURE &&
                    buildDetails !== undefined)
            ) {
                Logger.verbose(`Skill status response: ${JSON.stringify(response)}`);
                Logger.verbose("Skill build failure. Bailing out");
                bail(new AskError(SKILL_BUILD_FAILED));
                return;
            }

            if (
                response.manifest.status === SKILL.MANIFEST_STATUS.SUCCESS &&
                response.interactionModel.status === SKILL.INTERACTION_MODEL_STATUS.SUCCESS
            ) {
                return response;
            } else {
                const skillBuildMsg = "Skill build in progress. Retrying after timeout";
                Logger.verbose(skillBuildMsg);
                throw new AskError(skillBuildMsg);
            }
        }, retryOptions);
    }

    async deploySkill(view: AbstractWebView): Promise<void> {
        Logger.verbose("Calling method: deploySkill");
        try {
            const headBranch = this.skillRepo.state.HEAD?.name;
            if (headBranch === undefined) {
                throw new Error(`${this.fsPath} not a git repository. Cannot deploy non-hosted skills.`);
            }
            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: "Deploying skill",
                    cancellable: false,
                },
                async () => {
                    this.checkValidBranch(headBranch);
                    await this.checkValidStage(headBranch);

                    await this.checkInProgressCerts(undefined);

                    await this.skillRepo.push();
                }
            );

            void vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: "Deploying skill: Skill build in progress",
                    cancellable: false,
                },
                async () => {
                    const latestCommit = (await this.skillRepo?.log({ maxEntries: 1 }))![0];

                    try {
                        await this.pollSkillBuildStatus(latestCommit.hash);

                        const skillPackageStatus = await getSkillPackageStatus(
                            this.context,
                            this.skillId,
                            BRANCH_TO_STAGE[headBranch]
                        );
                        void this.postDeploySkill(BRANCH_TO_STAGE[headBranch], skillPackageStatus.skill?.eTag);
                        Logger.info(SKILL_BUILD_STATUS_SUCCEEDED_MSG);
                        void vscode.window.showInformationMessage(SKILL_BUILD_STATUS_SUCCEEDED_MSG);
                    } catch (err) {
                        throw loggableAskError(SKILL_BUILD_STATUS_FAILED_MSG, err, true);
                    } finally {
                        view.dispose();
                    }
                }
            );
        } catch (err) {
            throw loggableAskError(SKILL_DEPLOY_STATUS_FAILED_MSG, err, true);
        }
    }
}
