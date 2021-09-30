/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import * as assert from "assert";
import child_process from "child_process";
import fs from "fs";
import * as path from "path";
import * as sinon from "sinon";
import * as vscode from "vscode";
import {DebugAdapterPathCommand} from "../../../src/askContainer/commands/local-debug/debugAdapterPath";
import {LOCAL_DEBUG} from "../../../src/constants";
import {stubTelemetryClient} from "../../../test/testUtilities";

describe("Command ask.debugAdapterPath", () => {
  let command: DebugAdapterPathCommand;
  let sandbox: sinon.SinonSandbox;
  let commandId: string;
  before(() => {
    command = new DebugAdapterPathCommand();
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

  it("Should be able to return node local debugger path from the installed node_modules", async () => {
    const mockedDebugArgs = {
      type: "pwa-node",
    };
    const fakePath = [{fsPath: "test"}];

    sandbox.stub(vscode.workspace, "findFiles").resolves(fakePath);

    const debuggerPath = await vscode.commands.executeCommand(commandId, mockedDebugArgs);
    assert.ok(debuggerPath === fakePath[0].fsPath);
  });

  it("Should be able to return python local debugger path from the installed node_modules", async () => {
    const mockPythonPath = "test/site-packages";
    const localDebuggerPath = path.join(mockPythonPath, LOCAL_DEBUG.PYTHON_DEPENDENCIES.DEP_PATH);
    const mockedDebugArgs = {
      type: "python",
      pythonPath: mockPythonPath,
    };
    const testSitePkgLocation = "['test/site-packages']";

    sandbox.stub(child_process, "execSync");
    sandbox.stub(TextDecoder.prototype, "decode").returns(testSitePkgLocation);
    sandbox.stub(fs, "existsSync").withArgs(localDebuggerPath).returns(true);

    const debuggerPath = await vscode.commands.executeCommand(commandId, mockedDebugArgs);
    assert.ok(debuggerPath === localDebuggerPath);
  });
});
