import * as assert from "assert";
import * as fs from "fs";
import * as sinon from "sinon";
import * as nock from "nock";
import { CustomSmapiClientBuilder } from "ask-smapi-sdk";
import * as vscode from "vscode";
import { PassThrough } from "stream";

import { SchemaManager } from "../../src/utils/schemaHelper";
import * as profileHelper from "../../src/runtime/lib/utils/profileHelper";
import { SmapiClientFactory } from "../../src/runtime";
import { Logger } from "../../src/logger";
import { SCHEMA } from "../../src/constants";
import { ext } from "../../src/extensionGlobals";
import * as workspaceHelper from "../../src/utils/workspaceHelper";

describe("SkillPackageSchema tests", () => {
    const FAKE_SKILL_PATH = "fakeSkillPath";
    const FAKE_VENDOR_ID = "fakeID";
    const FAKE_ERROR = "fakeError";
    const FAKE_LOCATION_URL = "https://example.com/users";
    const FAKE_SCHEMA_FOLDER_PATH = "fakeSchemaPath";
    let sandbox: sinon.SinonSandbox;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("getSchemaLocationUrl function tests", () => {
        const getSchemaLocationUrl = SchemaManager.getInstance()["getSchemaLocationUrl"];
        const fakeSmapiInstance = new CustomSmapiClientBuilder()
            .withRefreshTokenConfig({ clientId: "", clientSecret: "", refreshToken: "" })
            .client();

        beforeEach(() => {
            sandbox.stub(profileHelper, "getCachedProfile").returns(undefined);
            sandbox.stub(SmapiClientFactory, "getInstance").returns(fakeSmapiInstance);
        });

        it("should throw AskError when failed to retrieve vendorId for the profile", async () => {
            sandbox.stub(profileHelper, "resolveVendorId").throws(new Error("testError"));
            try {
                await getSchemaLocationUrl(SCHEMA.SKILL_PACKAGE);
            } catch (e) {
                assert.strictEqual(e.name, "AskError");
                assert.strictEqual(e.message, "Failed to retrieve vendorID for profile default. Reason: testError");
            }
        });

        it("should throw AskError when failed to get resource schema", async () => {
            sandbox.stub(profileHelper, "resolveVendorId").returns(FAKE_VENDOR_ID);
            sandbox.stub(fakeSmapiInstance, "getResourceSchemaV1").throws(new Error("testError"));
            try {
                await getSchemaLocationUrl(SCHEMA.SKILL_PACKAGE);
            } catch (e) {
                assert.strictEqual(e.name, "AskError");
                assert.strictEqual(
                    e.message,
                    `Failed to get skill-package schema for vendorId ${FAKE_VENDOR_ID}. Reason: testError`
                );
            }
        });

        it("should throw AskError when schemaLocationUrl is not present in response", async () => {
            const testResponse = {
                schemaLocationUrl: undefined,
                expiryTime: undefined,
            };
            sandbox.stub(profileHelper, "resolveVendorId").returns(FAKE_VENDOR_ID);
            sandbox.stub(fakeSmapiInstance, "getResourceSchemaV1").resolves(testResponse);
            try {
                await getSchemaLocationUrl(SCHEMA.SKILL_PACKAGE);
            } catch (e) {
                assert.strictEqual(e.name, "AskError");
                assert.strictEqual(e.message, `Failed to retrieve skillPackageStructure schema location url.`);
            }
        });

        it("should be able to return valid schema location url", async () => {
            const testResponse = {
                schemaLocationUrl: FAKE_LOCATION_URL,
                expiryTime: undefined,
            };
            sandbox.stub(profileHelper, "resolveVendorId").returns(FAKE_VENDOR_ID);
            sandbox.stub(fakeSmapiInstance, "getResourceSchemaV1").resolves(testResponse);

            const schemaLocationUrl = await getSchemaLocationUrl(SCHEMA.SKILL_PACKAGE);
            assert.strictEqual(schemaLocationUrl, FAKE_LOCATION_URL);
        });
    });

    describe("updateSkillPackageSchema function tests", () => {
        let mockStream: PassThrough;

        beforeEach(() => {
            sandbox.stub(profileHelper, "resolveVendorId").returns(FAKE_VENDOR_ID);
            mockStream = new PassThrough();
            sandbox.stub(fs, "createWriteStream").returns(mockStream);
            sandbox.stub(SchemaManager.getInstance() as any, "getSchemaLocationUrl").resolves(FAKE_LOCATION_URL);
        });
        afterEach(() => {
            nock.cleanAll();
        });
        it("Should throw error when download schema fail", async () => {
            nock("https://example.com").get("/users").replyWithError(FAKE_ERROR);

            try {
                await SchemaManager.getInstance()["updateSkillPackageSchema"](FAKE_SCHEMA_FOLDER_PATH);
            } catch (e) {
                // assert.strictEqual(e.name, "AskError");
                assert.strictEqual(e.message, `Download skill package schema failed. Reason: ${FAKE_ERROR}`);
            }
        });

        it("Should be able to catch schema at local", done => {
            nock("https://example.com").get("/users").reply(200, "body");
            const loggerSpy = sandbox.stub(Logger, "info");

            void SchemaManager.getInstance()["updateSkillPackageSchema"](FAKE_SCHEMA_FOLDER_PATH);
            setTimeout(() => {
                mockStream.emit("close");
                assert.ok(loggerSpy.calledOnceWith("skill package schema has been updated."));
                done();
            }, 100);
        });
    });

    describe("registerSkillPackageWatcher", () => {
        it("when no SkillPackage is registered before, should only register a new watcher", () => {
            const logSpy = sandbox.stub(Logger, "info");
            SchemaManager.getInstance()["registerSkillPackageWatcher"](FAKE_SKILL_PATH);

            assert.ok(logSpy.calledOnceWith("SkillPackageWatcher is started"));
            assert.strictEqual(ext.skillPackageWatcher.skillPath, FAKE_SKILL_PATH);
        });

        it("when SkillPackage is already registered before, should dispose first", () => {
            const logSpy = sandbox.stub(Logger, "info");
            SchemaManager.getInstance()["registerSkillPackageWatcher"](FAKE_SKILL_PATH);

            assert.ok(logSpy.calledTwice);
            assert.ok(logSpy.calledWith("SkillPackageWatcher is disposed"));
            assert.ok(logSpy.calledWith("SkillPackageWatcher is started"));
            assert.strictEqual(ext.skillPackageWatcher.skillPath, FAKE_SKILL_PATH);
        });
    });

    describe("updateSchemas", () => {
        it("when no opened skill in workspace, should not update schema", async () => {
            const logSpy = sandbox.stub(Logger, "info");
            sandbox.stub(workspaceHelper, "findSkillFoldersInWs").resolves([]);

            await SchemaManager.getInstance().updateSchemas();

            assert.ok(logSpy.calledOnceWith("Vendor specific schemas are not updated."));
        });

        it("when more than one skill in workspace, should not update schema", async () => {
            const logSpy = sandbox.stub(Logger, "info");
            const fakeSkills = [vscode.Uri.file(".."), vscode.Uri.file("..")];
            sandbox.stub(workspaceHelper, "findSkillFoldersInWs").resolves(fakeSkills);

            await SchemaManager.getInstance().updateSchemas();

            assert.ok(logSpy.calledOnceWith("Vendor specific schemas are not updated."));
        });

        it("when schema folder not exist, should create a new schema folder", async () => {
            const fakeSkillPath = "fakePath";
            const fakeSkills = [vscode.Uri.file(fakeSkillPath)];
            sandbox.stub(workspaceHelper, "findSkillFoldersInWs").resolves(fakeSkills);
            sandbox.stub(fs, "existsSync").returns(false);
            const updateSkillPackageSchemaSpy = sandbox.stub(
                SchemaManager.getInstance() as any,
                "updateSkillPackageSchema"
            ).resolves();
            const registerSkillPackageWatcherSpy = sandbox.stub(
                SchemaManager.getInstance() as any,
                "registerSkillPackageWatcher"
            );
            const mkdirSpy = sandbox.stub(fs, "mkdirSync");
            const expectedSchemaFolderPath = `/${fakeSkillPath}/.ask/schema`;

            await SchemaManager.getInstance().updateSchemas();
            
            assert.ok(mkdirSpy.calledOnceWith(expectedSchemaFolderPath));
            assert.ok(updateSkillPackageSchemaSpy.calledOnceWith(expectedSchemaFolderPath));
            assert.ok(registerSkillPackageWatcherSpy.calledOnceWith(`/${fakeSkillPath}`));
        });
    });
});
