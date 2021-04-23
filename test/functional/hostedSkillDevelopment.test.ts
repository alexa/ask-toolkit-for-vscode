/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import * as path from 'path';
import * as sinon from 'sinon';
import * as assert from "assert";

import { CreateHostedSkillManager } from "../../src/askContainer/webViews/createSkillWebview/createHostedSkillManager";
import { FakeExtensionContext } from '../testUtilities';
import { createSkillWebViewType } from "../../src/askContainer/webViews/createSkillWebview/createSkillWebview";
import { SmapiClientFactory } from '../../src/runtime/lib/smapiClientFactory';
import { AskResources } from '../../src/models/resourcesConfig/askResource';


describe('Functional testing: Hosted skill development flow', () => {
    let sandbox: sinon.SinonSandbox;
    let fakeSkillId: string;

    const fakeSkillName = 'temp-hosted-skill';
    const fakeProfile = 'default';
    const fakeSkillPath = path.join(__dirname, '..', 'temp', fakeSkillName);
    const fakeFolderPath = path.join(__dirname, '..', 'temp');
    
    const fakeUserInput: createSkillWebViewType = {
        locale: 'en-US',
        runtime: 'NODE_10_X',
        region: 'US_EAST_1',
        skillFolder: fakeFolderPath,
        skillName: fakeSkillName,
        language: 'NodeJS',
        isHostedSkill: true
    }

    const fakeProgress = {
        report: () => {}
    }

    const createHostedSkillManager = new CreateHostedSkillManager(FakeExtensionContext.getFakeExtContext(), fakeSkillPath);

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Create a hosted skill',  () => {
        it('should create a hosted skill', async () => {
            fakeSkillId = await createHostedSkillManager.requestCreateSkill(fakeUserInput, fakeProgress);
            assert.notStrictEqual(fakeSkillId, undefined);
        });

        it('should clone the new hosted skill', async () => {
    
            if (!fakeSkillId) {
                assert.notStrictEqual(fakeSkillId, undefined);
            } else {
                await createHostedSkillManager.cloneSkill(fakeSkillId, fakeSkillName, fakeProgress);
                
                const askResources = new AskResources(fakeSkillPath);
                const skillId = askResources.getSkillId(fakeProfile);
                assert.strictEqual(skillId, fakeSkillId);
            }
        });

        it('delete the skill', async () => {
            try {
                await SmapiClientFactory.getInstance(fakeProfile, FakeExtensionContext.getFakeExtContext()).deleteSkillV1(fakeSkillId);
            } catch (error) {
               console.log(error); 
            }
        })
    });

});
