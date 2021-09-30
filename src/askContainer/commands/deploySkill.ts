/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import * as vscode from "vscode";
import {logAskError} from "../../exceptions";
import {Logger} from "../../logger";
import {AbstractCommand, CommandContext} from "../../runtime";
import {checkProfileSkillAccess} from "../../utils/skillHelper";
import {DeploySkillWebview} from "../webViews/deploySkillWebview";

export class DeploySkillCommand extends AbstractCommand<void> {
  private deploySkillWebview: DeploySkillWebview;

  constructor(webview: DeploySkillWebview) {
    super("askContainer.skillsConsole.deploySkill");
    this.deploySkillWebview = webview;
  }

  async execute(context: CommandContext, skillFolderWs: vscode.WorkspaceFolder): Promise<void> {
    Logger.debug(`Calling method: ${this.commandName}`);
    try {
      checkProfileSkillAccess(context.extensionContext);

      // eslint-disable-next-line @typescript-eslint/await-thenable
      await this.deploySkillWebview.showView();
    } catch (err) {
      throw logAskError(`Cannot open deploy skill view`, err, true);
    }
  }
}
