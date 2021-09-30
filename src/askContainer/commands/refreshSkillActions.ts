/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import {AbstractCommand, CommandContext} from "../../runtime";
import {Logger} from "../../logger";
import {onWorkspaceOpenEventEmitter} from "../events";

export class RefreshSkillActionsCommand extends AbstractCommand<void> {
  constructor() {
    super("askContainer.skill-actions.refresh");
  }

  async execute(context: CommandContext): Promise<void> {
    Logger.debug(`Calling method: ${this.commandName}`);
    onWorkspaceOpenEventEmitter.fire(undefined);
  }
}
