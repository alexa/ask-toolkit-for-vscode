/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import * as sinon from 'sinon';
import * as proxyquire from 'proxyquire';

import { Logger } from '../../../../src/logger';
import * as assert from "assert";
import * as path from 'path';

describe('Webview_DeployNonHostedSkillManager tests', () => {
    let sandbox: sinon.SinonSandbox;
    let proxy;

    const modulePath = path.join('..', '..', '..', '..', 'src', 'askContainer', 'webViews', 'deploySkillWebview', 'deployNonHostedSkillManager');

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

    describe('deploySkill', () => {
        let fakeView;
        beforeEach(() => {
            fakeView = {
                dispose: () => {}
            }
        });
        it('Should succeed to deploy a skill', async () => {
            proxy.DeployNonHostedSkillManager.prototype.currentHash = 'fakeHash';
            sandbox.stub(Logger, 'verbose');
            const deploySkillPackageStub = sandbox.stub(proxy.DeployNonHostedSkillManager.prototype, 'deploySkillPackage');
            await proxy.DeployNonHostedSkillManager.prototype.deploySkill(fakeView);
            assert.ok(deploySkillPackageStub.calledOnce);
        });
    });

});
