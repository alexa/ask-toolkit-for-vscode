/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import * as vscode from "vscode";
import * as assert from "assert";
import * as sinon from "sinon";

import {OpenWorkspaceCommand} from "../../../src/utils/commands/openWorkspace";
import * as workSpaceHelper from "../../../src/utils/workspaceHelper";
import {stubTelemetryClient} from "../../../test/testUtilities";

describe("Command ask.container.openWorkspace", () => {
  let command: OpenWorkspaceCommand;
  let sandbox: sinon.SinonSandbox;
  let commandId: string;
  before(() => {
    command = new OpenWorkspaceCommand();
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

  it("Should be able to call showOpenDialog with fixed config, and openWorkSpace folder with user provided path", async () => {
    const fakePath = ["fakePath"];
    const showOpenDialogStub = sandbox.stub(vscode.window, "showOpenDialog").resolves(fakePath);
    const openWorkspaceStub = sandbox.stub(workSpaceHelper, "openWorkspaceFolder");
    const expectedConfig = {
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
    };
    await vscode.commands.executeCommand(commandId);
    assert.ok(showOpenDialogStub.calledOnceWith(expectedConfig));
    assert.ok(openWorkspaceStub.calledOnceWith(fakePath[0]));
  });

  it("Should throw error when no workspace provided by user", async () => {
    sandbox.stub(vscode.window, "showOpenDialog").resolves(undefined);

    try {
      await vscode.commands.executeCommand(commandId);
    } catch (e) {
      assert.strictEqual(e.message, `Running the contributed command: '${commandId}' failed.`);

      return;
    }
    assert.fail("Should throw an error");
  });
});
