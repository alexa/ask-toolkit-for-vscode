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
import {DeployHostedSkillWebview} from "../webViews/deploySkillWebview/deployHostedSkillWebview";

export class DeployHostedSkillCommand extends AbstractCommand<void> {
  private deploySkillWebview: DeployHostedSkillWebview;

  constructor(webview: DeployHostedSkillWebview) {
    super("askContainer.skillsConsole.deployHostedSkill");
    this.deploySkillWebview = webview;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async execute(context: CommandContext, skillFolderWs: vscode.WorkspaceFolder): Promise<void> {
    Logger.debug(`Calling method: ${this.commandName}`);
    try {
      checkProfileSkillAccess(context.extensionContext);

      this.deploySkillWebview.showView();
    } catch (err) {
      throw logAskError(`Cannot open deploy skill view`, err, true);
    }
  }
}
