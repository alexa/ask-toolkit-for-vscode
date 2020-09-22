import * as vscode from "vscode";
import * as assert from "assert";
import * as sinon from "sinon";

import { OpenWorkspaceCommand } from "../../../src/utils/commands/openWorkspace";
import * as skillHelper from "../../../src/utils/skillHelper";
import { TelemetryClient } from "../../../src/runtime/lib/telemetry";
import * as workSpaceHelper from "../../../src/utils/workspaceHelper";

describe("Command_openWorkSpace tests", () => {
    let command: OpenWorkspaceCommand;
    let sandbox: sinon.SinonSandbox;
    before(() => {
        command = new OpenWorkspaceCommand();
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
        assert.equal(command.title, "ask.container.openWorkspace");
        assert.equal(command.command, "ask.container.openWorkspace");
    });

    it("Should be able to call showOpenDialog with fixed config, and openWorkSpace folder with user provided path", async () => {
        const fakePath = ['fakePath'];
        const showOpenDialogStub = sandbox.stub(vscode.window, "showOpenDialog").resolves(fakePath);
        const openWorkspaceStub = sandbox.stub(workSpaceHelper, 'openWorkspaceFolder');
        const expectedConfig = {
            "canSelectFiles": false,
            "canSelectFolders": true,
            "canSelectMany": false
        };
        await vscode.commands.executeCommand("ask.container.openWorkspace");
        assert.ok(showOpenDialogStub.calledOnceWith(expectedConfig));
        assert.ok(openWorkspaceStub.calledOnceWith(fakePath[0]));
    });

    it("Should throw error when no workspace provided by user", async () => {
        sandbox.stub(vscode.window, "showOpenDialog").resolves(undefined);

        try {
            await vscode.commands.executeCommand("ask.container.openWorkspace");
        } catch(e) {
            assert.equal(e.message, 'Cannot find a workspace to create the skill project.');

            return;
        }
        assert.fail("Should throw an error");
    });
});
