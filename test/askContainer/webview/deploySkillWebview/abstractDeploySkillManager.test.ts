/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import * as sinon from 'sinon';
import * as proxyquire from 'proxyquire';
import * as assert from "assert";

import { Logger } from '../../../../src/logger';
import { expect } from 'chai';
import { AskStates } from '../../../../src/models/resourcesConfig/askStates';
import * as path from 'path';

describe('Webview_DeployHostedSkillManager tests', () => {
    let sandbox: sinon.SinonSandbox;
    let proxy;

    const modulePath = path.join('..', '..', '..', '..', 'src', 'askContainer', 'webViews', 'deploySkillWebview', 'abstractDeploySkillManager');

    const skillHelperStub = {
        getSkillDetailsFromWorkspace: () => { 
            return { skillId: 'fakeSkillId' }
        }
    }
    const skillPackageHelperStub = {
        deploySkillPackage: () => 'fakeImportId',
        pollImportStatus: () => {
            return {
                skill: {
                    eTag: 'fakeETag'
                }
            }
        }
    }
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        proxy = proxyquire(modulePath, {});
    });

    afterEach(() => {
        sandbox.restore();
    });

    // TODO: To test constructor, need to solve the problem that "new" an instance and still stub an import util method
    // describe('constructor', () => {
    //     it('Should initialize successfully', () => {
    //     });
    // })

    describe('deploySkillPackage', () => {
        let fakeView;
        const exceptionStub = {
            loggableAskError: () => {}
        }
        beforeEach(() => {
            fakeView = {
                dispose: () => {}
            }
            proxy = proxyquire(modulePath, {
                '../../../utils/skillHelper../../../utils/skillHelper': skillHelperStub,
                '../../../utils/skillPackageHelper': skillPackageHelperStub,
                '../../../exceptions': exceptionStub
            });
        });
        it('Should log error as post deploy skill failed', async () => {
            const errorMessage = "Skill package build failed";
            sandbox.stub(Logger, 'verbose');
            sandbox.stub(proxy.AbstractDeploySkillManager.prototype, 'postDeploySkill').throws();
            const loggerErrorStub = sandbox.stub(exceptionStub, 'loggableAskError');            
            await proxy.AbstractDeploySkillManager.prototype.deploySkillPackage(fakeView);
            assert.ok(loggerErrorStub.callsArgWith(1, errorMessage));
        });
        it('Should succeed to deploy skill package', async () => {
            sandbox.stub(Logger, 'verbose');
            sandbox.stub(Logger, 'info');
            sandbox.stub(proxy.AbstractDeploySkillManager.prototype, 'postDeploySkill');
            const loggerErrorStub = sandbox.stub(exceptionStub, 'loggableAskError');            
            await proxy.AbstractDeploySkillManager.prototype.deploySkillPackage(fakeView);
            assert.ok(loggerErrorStub.notCalled);
        });
    });

    describe('postDeploySkill', () => {
        const fakeStage = 'development';
        const fakeETag = 'fakeETag';
        const fakeFsPath = path.join(__dirname, '..', '..', '..', 'mockSkill');
        beforeEach(() => {
            proxy = proxyquire(modulePath, {});
            proxy.AbstractDeploySkillManager.prototype.fsPath = fakeFsPath;
        });
        it('Should log error for no skill package eTag', async () => {
            const errorMessage = "Cannot fetch the skill package eTag";
            sandbox.stub(Logger, 'verbose');
            sandbox.stub(AskStates.prototype);
            const loggerErrorStub = sandbox.stub(Logger, 'error');
            await proxy.AbstractDeploySkillManager.prototype.postDeploySkill(fakeStage);
            assert.ok(loggerErrorStub.calledWithExactly(errorMessage));
        });
        it('Should succeed for post deploy skill', async () => {
            const fakeDeployHash = "fakeDeployHash";
            sandbox.stub(Logger, 'verbose');
            sandbox.stub(AskStates.prototype);
            const loggerErrorStub = sandbox.stub(Logger, 'error');
            await proxy.AbstractDeploySkillManager.prototype.postDeploySkill(fakeStage, fakeETag, fakeDeployHash);
            assert.ok(loggerErrorStub.notCalled);
        });
    });

});
