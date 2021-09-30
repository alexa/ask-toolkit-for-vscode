/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import {logAskError} from "../../exceptions";
import {Logger} from "../../logger";
import {AbstractCommand, CommandContext} from "../../runtime";
import {SimulateSkillWebview} from "../webViews/simulateSkillWebview";

export class SimulateSkillCommand extends AbstractCommand<void> {
  private simulateSkillWebview: SimulateSkillWebview;

  constructor(webview: SimulateSkillWebview) {
    super("askContainer.skillsConsole.simulateSkill");
    this.simulateSkillWebview = webview;
  }

  async execute(context: CommandContext): Promise<void> {
    Logger.debug(`Calling method: ${this.commandName}`);
    try {
      this.simulateSkillWebview.showView();
    } catch (err) {
      throw logAskError(`Cannot open test skill view`, err, true);
    }
  }
}
