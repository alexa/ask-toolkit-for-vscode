/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import {AbstractCommand, CommandContext} from "../../runtime";
import {ToolkitUpdateWebview} from "../webViews/toolkitUpdateWebview";
import {Logger} from "../../logger";

export class ShowToolkitUpdatesCommand extends AbstractCommand<void> {
  private toolkitUpdate: ToolkitUpdateWebview;

  constructor(toolkitUpdate: ToolkitUpdateWebview) {
    super("ask.showToolkitUpdates");
    this.toolkitUpdate = toolkitUpdate;
  }

  async execute(context: CommandContext): Promise<void> {
    Logger.debug(`Calling method: ${this.commandName}`);
    this.toolkitUpdate.showView();
  }
}
