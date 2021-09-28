/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import * as assert from "assert";
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as sinon from "sinon";
import * as vscode from "vscode";
import { DebugAdapterPathCommand } from "../../../src/askContainer/commands/local-debug/debugAdapterPath";
import { stubTelemetryClient } from '../../../test/testUtilities';


describe.only("Command ask.debugAdapterPath", () => {
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
            'type': 'pwa-node'
        }
        const fakePath = [ {'fsPath': "test"}];
        
        sinon.stub(vscode.workspace, "findFiles").resolves(fakePath);
        
        const debuggerPath = await vscode.commands.executeCommand(commandId, mockedDebugArgs);
        assert.ok(debuggerPath === fakePath[0].fsPath);
    });

    it("Should be able to return python local debugger path from the installed node_modules", async () => {
        const mockPythonPath = 'test/site-packages';
        const localDebuggerPath = 'test/site-packages/ask_sdk_local_debug/local_debugger_invoker.py'
        const mockedDebugArgs = {
            'type': 'python',
            'pythonPath': mockPythonPath
        }
        const testSitePkgLocation = "['test/site-packages']";

        sinon.stub(child_process, "execSync")
        sinon.stub(TextDecoder.prototype, "decode").returns(testSitePkgLocation);
        sinon.stub(fs, "existsSync").withArgs(localDebuggerPath).returns(true);
        
        const debuggerPath = await vscode.commands.executeCommand(commandId, mockedDebugArgs);
        assert.ok(debuggerPath === localDebuggerPath);
    });
})