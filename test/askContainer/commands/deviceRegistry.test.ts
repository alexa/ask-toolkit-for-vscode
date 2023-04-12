/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import * as vscode from "vscode";
import * as assert from "assert";
import * as sinon from "sinon";

import {DeviceRegistryCommand} from "../../../src/askContainer/commands/deviceRegistryCommand";
import {stubTelemetryClient} from "../../../test/testUtilities";

describe("Command askContainer.skillsConsole.deviceRegistry", () => {
  let command: DeviceRegistryCommand;
  let sandbox: sinon.SinonSandbox;

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

  it("Should show the view when executed", async () => {
    const showViewSpy = sinon.spy();

    command = new DeviceRegistryCommand({showView: showViewSpy} as any, "askContainer.skillsConsole.deviceRegistryTest");
    /*
        undefined argument due to

        https://code.visualstudio.com/api/references/contribution-points#contributes.menus
        Note: When a command is invoked from a (context) menu, VS Code tries to infer the currently selected resource 
        and passes that as a parameter when invoking the command. 

    */
    await vscode.commands.executeCommand("askContainer.skillsConsole.deviceRegistryTest", undefined);

    assert.ok(showViewSpy.called);
  });
});
