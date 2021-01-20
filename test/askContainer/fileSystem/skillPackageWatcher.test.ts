import * as assert from 'assert';
import * as fs from 'fs';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as path from 'path';

import { SkillPackageWatcher } from '../../../src/askContainer/fileSystem/skillPackageWatcher';
import { SKILL_PACKAGE_FORMAT_GUID } from '../../../src/constants';
import { Logger } from '../../../src/logger';
import * as skillHelper from '../../../src/utils/skillHelper';
import * as Util from '../../../src/runtime/lib/utils/profileHelper';
import Sinon = require('sinon');

describe('SkillPackageWatcher', () => {
    const fakeSkillPath = 'fakeSkillPath';
    const validSkillPath = path.join(__dirname, '..', '..', 'mockSkill');
    const validSkillPackagePath = path.join(validSkillPath, 'skill-package');
    let sandbox: sinon.SinonSandbox;
    let warningMessageSpy: sinon.SinonStub;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        warningMessageSpy = sandbox.stub(vscode.window, 'showWarningMessage');
        sandbox.stub(Util, 'getCachedProfile').returns(undefined);
    });
    afterEach(() => {
        sandbox.restore();
    });
    describe('constructor tests', () => {
        it('when skillPath is not correct, should not register the watcher', () => {
            const watcher = new SkillPackageWatcher(fakeSkillPath);

            assert.strictEqual(watcher.skillPackageSchema, undefined);
            assert.strictEqual(watcher.skillPackagePath, undefined);
            assert.strictEqual(watcher.fileSystemWatcher, undefined);
        });

        it('when unable to get skillPackagePath, should not register the watcher', () => {
            const fakeError = new Error('fakeError');
            sandbox.stub(skillHelper, 'getSkillMetadataSrc').throws(fakeError);

            const watcher = new SkillPackageWatcher(validSkillPath);

            assert.ok(
                warningMessageSpy.calledOnceWith(
                    `Failed to read skill package path due to ${fakeError}, the skill package watcher won't start.`
                )
            );
            assert.ok(watcher.skillPackageSchema !== undefined);
            assert.strictEqual(watcher.skillPackagePath, undefined);
            assert.strictEqual(watcher.fileSystemWatcher, undefined);
        });

        it('when skillPath is valid, should be able to register the watcher', () => {
            sandbox.stub(skillHelper, 'getSkillMetadataSrc').returns({ skillPackageAbsPath: validSkillPackagePath });

            const watcher = new SkillPackageWatcher(validSkillPath);

            assert.ok(watcher.skillPackageSchema !== undefined);
            assert.strictEqual(watcher.skillPackagePath, validSkillPackagePath);
            assert.ok(watcher.fileSystemWatcher !== undefined);
        });
    });

    describe('validate tests', () => {
        let watcher: SkillPackageWatcher;
        let getSkillMetadataSrcStub: Sinon.SinonStub;
        beforeEach(() => {
            getSkillMetadataSrcStub = sandbox
                .stub(skillHelper, 'getSkillMetadataSrc')
                .returns({ skillPackageAbsPath: validSkillPackagePath });
            watcher = new SkillPackageWatcher(validSkillPath);
        });

        it('validate function should restart the watcher when skillPackagePath changed', () => {
            getSkillMetadataSrcStub.restore();
            sandbox
                .stub(skillHelper, 'getSkillMetadataSrc')
                .returns({ skillPackageAbsPath: path.join(validSkillPath, 'skill-package-NHS') });
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const disposeSpy = sandbox.spy(watcher.fileSystemWatcher!, 'dispose');

            watcher.validate();

            assert.ok(disposeSpy.calledOnce);
        });

        it('should display warning message when skill.json not exist', () => {
            getSkillMetadataSrcStub.restore();
            sandbox
                .stub(skillHelper, 'getSkillMetadataSrc')
                .returns({ skillPackageAbsPath: path.join(validSkillPath, 'skill-package-NHS') });
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const disposeSpy = sandbox.spy(watcher.fileSystemWatcher!, 'dispose');

            watcher.validate();


            assert.ok(disposeSpy.calledOnce);
            assert.ok(
                warningMessageSpy.calledWith(`skill.json is missing in skill-package. ${SKILL_PACKAGE_FORMAT_GUID}`)
            );
        });

        it('validate function should not be executed when the watcher is not well constructed', () => {
            const debugSpy = sandbox.stub(Logger, 'debug');
            const inValidWatcher = new SkillPackageWatcher(fakeSkillPath);

            inValidWatcher.validate();

            assert.ok(debugSpy.calledWith('validate function of skillPackageWatcher is not executed'));
        });

        it('should display warning message when unexpected file/folder exist in skill package', () => {

            watcher.validate();

            assert.ok(warningMessageSpy.calledTwice);
            assert.ok(
                warningMessageSpy.calledWith(
                    `skill-package/interaction is not following the correct format of skill-package structure,\n            thus it won't be consumed at service side. ${SKILL_PACKAGE_FORMAT_GUID}`
                )
            );
            assert.ok(
                warningMessageSpy.calledWith(
                    `skill-package/alexaSkill.json is not following the correct format of skill-package structure,\n            thus it won't be consumed at service side. ${SKILL_PACKAGE_FORMAT_GUID}`
                )
            );
        });
    });

    describe('dispose', () => {
        let watcher: SkillPackageWatcher;
        let getSkillMetadataSrcStub: Sinon.SinonStub;
        beforeEach(() => {
            getSkillMetadataSrcStub = sandbox
                .stub(skillHelper, 'getSkillMetadataSrc')
                .returns({ skillPackageAbsPath: validSkillPackagePath });
            watcher = new SkillPackageWatcher(validSkillPath);
        });
        it('should be able to dispose fileSystemWatcher', () => {
            const disposeSpy = sandbox.spy(watcher.fileSystemWatcher as vscode.FileSystemWatcher, 'dispose');
            watcher.dispose();

            assert.ok(disposeSpy.calledOnce);
        });
    });
});
