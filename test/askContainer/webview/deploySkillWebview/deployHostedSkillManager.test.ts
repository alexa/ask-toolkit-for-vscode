/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import * as sinon from 'sinon';
import * as proxyquire from 'proxyquire';
import * as path from 'path';
import { CustomSmapiClientBuilder } from "ask-smapi-sdk";

import { Logger } from '../../../../src/logger'; 
import { SmapiClientFactory } from '../../../../src/runtime';
import * as assert from "assert";

describe('Webview_DeployHostedSkillManager tests', () => {
    let sandbox: sinon.SinonSandbox;
    let proxy;

    const modulePath = path.join('..', '..', '..', '..', 'src', 'askContainer', 'webViews', 'deploySkillWebview', 'deployHostedSkillManager');
    const fakeSmapiInstance = new CustomSmapiClientBuilder()
        .withRefreshTokenConfig({ clientId: "", clientSecret: "", refreshToken: "" })
        .client();
    const fakeFsPath = 'fakeFsPath';

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(SmapiClientFactory, "getInstance").returns(fakeSmapiInstance);
        proxy = proxyquire(modulePath, {});
        proxy.DeployHostedSkillManager.prototype.smapiClient = fakeSmapiInstance;
    });

    afterEach(() => {
        sandbox.restore();
    });

    // TODO: To test constructor, need to solve the problem that "new" an instance and still stub an import util method
    // describe('constructor', () => {
    //     it('Should initialize successfully', () => {
    //     });
    // })

    describe('checkValidBranch', () => {
        it('Should throw error for invalid branch', () => {
            const fakeBranch = 'fakeBranch';
            const testError = `Hosted skills cannot be deployed through ${fakeBranch} branch. Please merge your branch into remote master branch.`;
            sandbox.stub(Logger, 'verbose');
            try {
                proxy.DeployHostedSkillManager.prototype.checkValidBranch(fakeBranch);
            } catch (e) {
                assert.strictEqual(e.name, 'AskError');
                assert.strictEqual(e.message, testError);
            }
        });
    });

    describe('checkValidStage', () => {
        it('Should throw error for invalid stage', async () => {
            const fakeBranch = 'fakeBranch';
            const testError = `No skill stage available for ${fakeBranch} branch. The current branch must be either master or prod..`;
            sandbox.stub(Logger, 'verbose');
            try {
                await proxy.DeployHostedSkillManager.prototype.checkValidStage(fakeBranch);
            } catch (e) {
                assert.strictEqual(e.name, 'AskError');
                assert.strictEqual(e.message, testError);
            }
        });

        it('Should throw error for failing to get skill manifest', async () => {
            const fakeBranch = 'prod';
            const testError = 'Fail to get skill manifest';
            sandbox.stub(Logger, 'verbose');
            sandbox.stub(fakeSmapiInstance, "getSkillManifestV1").throws(testError);
            try {
                await proxy.DeployHostedSkillManager.prototype.checkValidStage(fakeBranch);
            } catch (e) {
                assert.strictEqual(e.name, 'AskError');
                assert.strictEqual(e.message, `${testError}.`);
            }
        });

        it('Should succeed to get skill manifest', async () => {
            const fakeBranch = 'prod';
            sandbox.stub(Logger, 'verbose');
            
            const manifestStub = sandbox.stub(fakeSmapiInstance, "getSkillManifestV1");
            await proxy.DeployHostedSkillManager.prototype.checkValidStage(fakeBranch);
            assert.ok(manifestStub.calledOnce);
        });

    });

    describe('checkInProgressCerts', () => {
        it('Should throw error for failing to get certifications list ', async () => {
            const fakeToken = 'fakeToken';
            const testError = `testError`;
            const errorMessage = `Couldn't check certification status for skill. ${testError}.`;
            sandbox.stub(Logger, 'verbose');
            sandbox.stub(fakeSmapiInstance, "getCertificationsListV1").throws(testError);

            try {
                await proxy.DeployHostedSkillManager.prototype.checkInProgressCerts(fakeToken);
            } catch (e) {
                assert.strictEqual(e.name, 'AskError');
                assert.strictEqual(e.message, errorMessage);
            }
        });

        it('Should throw error as skill is in review', async () => {
            const fakeToken = 'fakeToken';
            const testError = `Your skill is in review. If you want to make any changes to the code, withdraw the skill from certification or publish to live.`;
            const fakeCertificationListResponse = {
                items: [ { status : 'IN_PROGRESS'}]
            }
            sandbox.stub(Logger, 'verbose');
            sandbox.stub(fakeSmapiInstance, "getCertificationsListV1").returns(fakeCertificationListResponse);

            try {
                await proxy.DeployHostedSkillManager.prototype.checkInProgressCerts(fakeToken);
            } catch (e) {
                assert.strictEqual(e.name, 'AskError');
                assert.strictEqual(e.message, `${testError}.`);
            }
        });

        it('Should check certifications recursively as certificationListResponse is truncated ', async () => {
            const fakeToken = 'fakeToken';
            const fakeCertificationListResponse0 = {
                isTruncated: true,
                nextToken: 'nextToken'
            }
            const fakeCertificationListResponse1 = {
                isTruncated: false,
            }
            sandbox.stub(Logger, 'verbose');
            const certificationsStub = sandbox.stub(fakeSmapiInstance, "getCertificationsListV1");
            certificationsStub.onCall(0).returns(fakeCertificationListResponse0);
            certificationsStub.onCall(1).returns(fakeCertificationListResponse1);

            await proxy.DeployHostedSkillManager.prototype.checkInProgressCerts(fakeToken);
            assert.ok(certificationsStub.calledTwice);
        });
    });

    describe('pollSkillBuildStatus', () => {
        it('Should throw error as hosted skill status failed', async () => {
            const fakeCommitId = 'fakeCommitId';
            const fakeError = 'fakeError';
            const fakeSkillStatusResponse_no_commitId = {}
            const fakeSkillStatusResponse_hostedSkill_in_process = {
                hostedSkillDeployment: {
                    lastUpdateRequest: {
                        deploymentDetails: {
                            commitId: 'fakeCommitId'
                        },
                        status: 'IN_PROGRESS'
                    }
                }
            }
            const fakeSkillStatusResponse_hostedSkill_failed = {
                hostedSkillDeployment: {
                    lastUpdateRequest: {
                        deploymentDetails: {
                            commitId: 'fakeCommitId'
                        },
                        status: 'FAILED',
                        errors: [{ message: "fakeError"}]
                    }
                }
            }
            sandbox.stub(Logger, 'verbose');
            const skillStatusStub = sandbox.stub(fakeSmapiInstance, "getSkillStatusV1");
            skillStatusStub.onCall(0).returns(fakeSkillStatusResponse_no_commitId);
            skillStatusStub.onCall(1).returns(fakeSkillStatusResponse_hostedSkill_in_process);
            skillStatusStub.onCall(2).returns(fakeSkillStatusResponse_hostedSkill_failed);
            try {
                await proxy.DeployHostedSkillManager.prototype.pollSkillBuildStatus(fakeCommitId);
            } catch (e) {
                assert.strictEqual(e.name, 'AskError');
                assert.strictEqual(e.message, `Hosted skill deployment failed. Reason: ${fakeError} `);
            }
        });
        it('Should throw error as manifest status failed', async () => {
            const fakeCommitId = 'fakeCommitId';
            const fakeError = 'Hosted skill deployment failed';
            const fakeSkillStatusResponse_manifest_in_process = {
                hostedSkillDeployment: {
                    lastUpdateRequest: {
                        deploymentDetails: {
                            commitId: 'fakeCommitId'
                        }
                    }
                },
                manifest: {
                    lastUpdateRequest: {
                        status: 'IN_PROGRESS'
                    }
                }
            }
            const fakeSkillStatusResponse_manifest_failed = {
                hostedSkillDeployment: {
                    lastUpdateRequest: {
                        deploymentDetails: {
                            commitId: 'fakeCommitId'
                        }
                    }
                },
                manifest: {
                    lastUpdateRequest: {
                        status: 'FAILED'
                    }
                }
            }
            sandbox.stub(Logger, 'verbose');
            const skillStatusStub = sandbox.stub(fakeSmapiInstance, "getSkillStatusV1");
            skillStatusStub.onCall(0).returns(fakeSkillStatusResponse_manifest_in_process);
            skillStatusStub.onCall(1).returns(fakeSkillStatusResponse_manifest_failed);
            try {
                await proxy.DeployHostedSkillManager.prototype.pollSkillBuildStatus(fakeCommitId);
            } catch (e) {
                assert.strictEqual(e.name, 'AskError');
                assert.strictEqual(e.message, fakeError);
            }
        });
        it('Should throw error as interaction model status failed', async () => {
            const fakeCommitId = 'fakeCommitId';
            const fakeLocale = 'fakeLocale';
            const fakeError = 'Hosted skill deployment failed';
            const fakeSkillStatusResponse_interactionModel_in_process = {
                hostedSkillDeployment: {
                    lastUpdateRequest: {
                        deploymentDetails: {
                            commitId: 'fakeCommitId'
                        }
                    }
                },
                interactionModel: {
                    [fakeLocale]: {
                        lastUpdateRequest: {
                            status: 'IN_PROGRESS'
                        }
                    }
                }
            }
            const fakeSkillStatusResponse_interactionModel_failed = {
                hostedSkillDeployment: {
                    lastUpdateRequest: {
                        deploymentDetails: {
                            commitId: 'fakeCommitId'
                        }
                    }
                },
                interactionModel: {
                    [fakeLocale]: {
                        lastUpdateRequest: {
                            status: 'FAILED',
                            buildDetails: {}
                        }
                    }
                }
            }
            sandbox.stub(Logger, 'verbose');
            const skillStatusStub = sandbox.stub(fakeSmapiInstance, "getSkillStatusV1");
            skillStatusStub.onCall(0).returns(fakeSkillStatusResponse_interactionModel_in_process);
            skillStatusStub.onCall(1).returns(fakeSkillStatusResponse_interactionModel_failed);
            try {
                await proxy.DeployHostedSkillManager.prototype.pollSkillBuildStatus(fakeCommitId);
            } catch (e) {
                assert.strictEqual(e.name, 'AskError');
                assert.strictEqual(e.message, fakeError);
            }
        });
        it('Should throw error as interaction model and manifest status are undefined', async () => {
            const fakeCommitId = 'fakeCommitId';
            const fakeError = 'Internal error with the service';
            const fakeSkillStatusResponse_interactionModel_manifest_undefined_status = {
                hostedSkillDeployment: {
                    lastUpdateRequest: {
                        deploymentDetails: {
                            commitId: 'fakeCommitId'
                        }
                    }
                }
            }
            sandbox.stub(Logger, 'verbose');
            sandbox.stub(fakeSmapiInstance, "getSkillStatusV1").onCall(0).returns(fakeSkillStatusResponse_interactionModel_manifest_undefined_status);
            try {
                await proxy.DeployHostedSkillManager.prototype.pollSkillBuildStatus(fakeCommitId);
            } catch (e) {
                assert.strictEqual(e.name, 'AskError');
                assert.strictEqual(e.message, fakeError);
            }
        });
        it('Should succeed to poll skill build status', async () => {
            const fakeCommitId = 'fakeCommitId';
            const fakeLocale = 'fakeLocale';
            const fakeSkillStatusResponse_interactionModel_manifest_undefined_status = {
                hostedSkillDeployment: {
                    lastUpdateRequest: {
                        deploymentDetails: {
                            commitId: 'fakeCommitId'
                        },
                        status: 'SUCCEEDED'
                    }
                },
                manifest: {
                    lastUpdateRequest: {
                        status: 'SUCCEEDED'
                    }
                },
                interactionModel: {
                    [fakeLocale]: {
                        lastUpdateRequest: {
                            status: 'SUCCEEDED'
                        }
                    }
                }
            }
            const fakeResponse = {
                hostedSkillDeployment: {
                    status: "SUCCEEDED",
                    errors: undefined
                },
                manifest: {
                    status: "SUCCEEDED",
                    errors: undefined
                },
                interactionModel: {
                    status: "SUCCEEDED",
                    errors: undefined
                },
            };
            sandbox.stub(Logger, 'verbose');
            sandbox.stub(fakeSmapiInstance, "getSkillStatusV1").onCall(0).returns(fakeSkillStatusResponse_interactionModel_manifest_undefined_status);
            const response = await proxy.DeployHostedSkillManager.prototype.pollSkillBuildStatus(fakeCommitId);
            assert.deepStrictEqual(response, fakeResponse);
        });
    });

    describe('deploySkill', () => {
        let fakeView;
        beforeEach(() => {
            proxy.DeployHostedSkillManager.prototype.fsPath = fakeFsPath;
            fakeView = {
                dispose: () => {}
            }
        });
        it('Should throw error as no github HEAD branch', async () => {
            const fakeSkillRepo = {
                state: {}
            }
            const errorMessage =`Skill deploy failed. Reason: ${fakeFsPath} not a git repository. Cannot deploy non-hosted skills.`;
            proxy.DeployHostedSkillManager.prototype.skillRepo = fakeSkillRepo;
            sandbox.stub(Logger, 'verbose');
            try {
                await proxy.DeployHostedSkillManager.prototype.deploySkill(fakeView);
            } catch (e) {
                assert.strictEqual(e.name, 'AskError');
                assert.strictEqual(e.message, errorMessage);
            }
        });
        it('Should log error as poll skill build status failed', async () => {
            const fakeSkillRepo = {
                state: {
                    HEAD: {
                        name: 'fakeName'
                    }
                },
                push: () => {},
                log:() => [{hash: 'fakeHash'}]
            }
            const exceptionStub= {
                loggableAskError: () => {}
            }
            const fakeError = 'fakeError';
            const errorMessage = 'Skill deploy failed';
            proxy = proxyquire(modulePath, {
                '../../../exceptions': exceptionStub
            });
            proxy.DeployHostedSkillManager.prototype.skillRepo = fakeSkillRepo;
            sandbox.stub(Logger, 'verbose');
            sandbox.stub(proxy.DeployHostedSkillManager.prototype, 'checkValidBranch');
            sandbox.stub(proxy.DeployHostedSkillManager.prototype, 'checkValidStage');
            sandbox.stub(proxy.DeployHostedSkillManager.prototype, 'checkInProgressCerts');
            sandbox.stub(proxy.DeployHostedSkillManager.prototype, 'pollSkillBuildStatus').throws(fakeError);
            const loggerStub = sandbox.stub(exceptionStub, 'loggableAskError');
            await proxy.DeployHostedSkillManager.prototype.deploySkill(fakeView);
            assert.ok(loggerStub.callsArgWith(1, errorMessage));
        });
        it('Should succeed to deploy a skill', async () => {
            const fakeSkillRepo = {
                state: {
                    HEAD: {
                        name: 'fakeName'
                    }
                },
                push: () => {},
                log:() => [{hash: 'fakeHash'}]
            }
            const skillPackageHelperStub = {
                getSkillPackageStatus: () => { 
                    return {skill: { eTag: 'fakeETag' }};
                }
            }
            const exceptionStub= {
                loggableAskError: () => {}
            }
            proxy = proxyquire(modulePath, {
                '../../../utils/skillPackageHelper': skillPackageHelperStub,
                '../../../exceptions': exceptionStub
            });
            sandbox.stub(Logger, 'verbose');
            sandbox.stub(Logger, 'info');
            proxy.DeployHostedSkillManager.prototype.skillRepo = fakeSkillRepo;
            sandbox.stub(proxy.DeployHostedSkillManager.prototype, 'checkValidBranch');
            sandbox.stub(proxy.DeployHostedSkillManager.prototype, 'checkValidStage');
            sandbox.stub(proxy.DeployHostedSkillManager.prototype, 'checkInProgressCerts');
            const pollStatusStub = sandbox.stub(proxy.DeployHostedSkillManager.prototype, 'pollSkillBuildStatus');
            sandbox.stub(proxy.DeployHostedSkillManager.prototype, 'postDeploySkill');
            const loggerStub = sandbox.stub(exceptionStub, 'loggableAskError');
            await proxy.DeployHostedSkillManager.prototype.deploySkill(fakeView);
            assert.doesNotThrow(pollStatusStub);
            assert.ok(loggerStub.notCalled);
        });
    });

});
