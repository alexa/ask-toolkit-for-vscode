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
import {InteractionModelSyncWebview} from "../webViews/interactionModelSync";

export class SyncInteractionModelCommand extends AbstractCommand<void> {
  private syncInteractionModelView: InteractionModelSyncWebview;

  constructor(syncInteractionModelView: InteractionModelSyncWebview) {
    super("ask.container.syncInteractionModel");
    this.syncInteractionModelView = syncInteractionModelView;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async execute(context: CommandContext, skillFolderWs: vscode.Uri): Promise<void> {
    Logger.debug(`Calling method: ${this.commandName}`);
    try {
      checkProfileSkillAccess(context.extensionContext);
      this.syncInteractionModelView.showView(skillFolderWs);
    } catch (err) {
      throw logAskError(`View failed to load; try again.`, err, true);
    }
  }
}
