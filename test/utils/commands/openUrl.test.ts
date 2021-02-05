import * as vscode from "vscode";
import * as assert from "assert";
import * as sinon from "sinon";

import { OpenUrlCommand } from "../../../src/utils/commands/openUrl";
import * as skillHelper from "../../../src/utils/skillHelper";
import { stubTelemetryClient } from '../../../test/testUtilities';
describe("Command ask.container.openUrl", () => {
    let command: OpenUrlCommand;
    let sandbox: sinon.SinonSandbox;
    let commandId: string;
    before(() => {
        command = new OpenUrlCommand();
        commandId = command.commandName;
    });
    after(() => {
        command.dispose();
    });
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        stubTelemetryClient(sandbox);
    });

    afterEach(() => {
        sandbox.restore();
    });
    it("Constructor should work as expected", () => {
        assert.strictEqual(command.title, commandId);
        assert.strictEqual(command.command, commandId);
    });

    it("Should check skillProfileAccess by default", async () => {
        const testUrl = "https://test.com";
        const skillAccessStub = sandbox.stub(skillHelper, "checkProfileSkillAccess");
        const openExternalStub = sandbox.stub(vscode.env, "openExternal");
        await vscode.commands.executeCommand(commandId, testUrl);
        assert.ok(skillAccessStub.calledOnce);
        assert.ok(openExternalStub.calledOnceWith(vscode.Uri.parse(testUrl)));
    });

    it("Should be able to skip skillProfileAccess", async () => {
        const testUrl = "https://test.com";
        const skillAccessStub = sandbox.stub(skillHelper, "checkProfileSkillAccess");
        const openExternalStub = sandbox.stub(vscode.env, "openExternal");
        await vscode.commands.executeCommand(commandId, testUrl, true);
        assert.ok(skillAccessStub.notCalled);
        assert.ok(openExternalStub.calledOnceWith(vscode.Uri.parse(testUrl)));
    });

    it("Should throw error when open url failed", async () => {
        const testUrl = "https://test.com";
        sandbox.stub(skillHelper, "checkProfileSkillAccess");
        sandbox.stub(vscode.env, "openExternal").throws(new Error("foo"));
        try {
            await vscode.commands.executeCommand(commandId, testUrl, true);
        } catch (e) {
            assert.strictEqual(e.message, `Running the contributed command: '${commandId}' failed.`);
            return;
        }
        assert.fail("Should throw an error");
    });
});
