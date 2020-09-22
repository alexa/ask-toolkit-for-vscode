import * as vscode from "vscode";
import * as assert from "assert";
import * as sinon from "sinon";

import { OpenUrlCommand } from "../../../src/utils/commands/openUrl";
import * as skillHelper from "../../../src/utils/skillHelper";
import { TelemetryClient } from "../../../src/runtime/lib/telemetry";

describe("Command_openUrl tests", () => {
    let command: OpenUrlCommand;
    let sandbox: sinon.SinonSandbox;
    before(() => {
        command = new OpenUrlCommand();
    });
    after(() => {
        command.dispose();
    });
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(TelemetryClient.prototype, "sendData");
    });

    afterEach(() => {
        sandbox.restore();
    });
    it("Constructor should work as expected", () => {
        assert.equal(command.title, "ask.container.openUrl");
        assert.equal(command.command, "ask.container.openUrl");
    });

    it("Should check skillProfileAccess by default", async () => {
        const testUrl = "https://test.com";
        const skillAccessStub = sandbox.stub(skillHelper, "checkProfileSkillAccess");
        const openExternalStub = sandbox.stub(vscode.env, "openExternal");
        await vscode.commands.executeCommand("ask.container.openUrl", testUrl);
        assert.ok(skillAccessStub.calledOnce);
        assert.ok(openExternalStub.calledOnceWith(vscode.Uri.parse(testUrl)));
    });

    it("Should be able to skip skillProfileAccess", async () => {
        const testUrl = "https://test.com";
        const skillAccessStub = sandbox.stub(skillHelper, "checkProfileSkillAccess");
        const openExternalStub = sandbox.stub(vscode.env, "openExternal");
        await vscode.commands.executeCommand("ask.container.openUrl", testUrl, true);
        assert.ok(skillAccessStub.notCalled);
        assert.ok(openExternalStub.calledOnceWith(vscode.Uri.parse(testUrl)));
    });

    it("Should throw error when open url failed", async () => {
        const testUrl = "https://test.com";
        sandbox.stub(skillHelper, "checkProfileSkillAccess");
        sandbox.stub(vscode.env, "openExternal").throws(new Error("foo"));
        try {
            await vscode.commands.executeCommand("ask.container.openUrl", testUrl, true);
        } catch (e) {
            assert.equal(e.message, `Open URL failed. Reason: foo`);

            return;
        }
        assert.fail("Should throw an error");
    });
});
