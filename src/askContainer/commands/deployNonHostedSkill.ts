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
import {DeployNonHostedSkillWebview} from "../webViews/deploySkillWebview/deployNonHostedSkillWebview";

export class DeployNonHostedSkillCommand extends AbstractCommand<void> {
  private deployNonHostedSkillWebview: DeployNonHostedSkillWebview;

  constructor(webview: DeployNonHostedSkillWebview) {
    super("askContainer.skillsConsole.deploySelfHostedSkill");
    this.deployNonHostedSkillWebview = webview;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async execute(context: CommandContext, skillFolderWs: vscode.WorkspaceFolder): Promise<void> {
    Logger.debug(`Calling method: ${this.commandName}`);
    try {
      checkProfileSkillAccess(context.extensionContext);

      this.deployNonHostedSkillWebview.showView();
    } catch (err) {
      throw logAskError(`Cannot open deploy skill view`, err, true);
    }
  }
}
