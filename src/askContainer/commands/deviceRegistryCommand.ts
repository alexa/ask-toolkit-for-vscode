/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/

import {logAskError} from "../../exceptions";
import {Logger} from "../../logger";
import {AbstractCommand, CommandContext} from "../../runtime";
import {DeviceRegistryWebview} from "../webViews/deviceRegistryWebview";

export class DeviceRegistryCommand extends AbstractCommand<void> {
  private deviceRegistryWebview: DeviceRegistryWebview;

  constructor(webview: DeviceRegistryWebview, commandOverride?: string) {
    super(commandOverride ?? "askContainer.skillsConsole.deviceRegistry");
    this.deviceRegistryWebview = webview;
  }

  async execute(context: CommandContext): Promise<void> {
    Logger.debug(`Calling method: ${this.commandName}`);
    try {
      this.deviceRegistryWebview.showView();
    } catch (err) {
      throw logAskError(`Cannot open device registry webview`, err, true);
    }
  }
}
