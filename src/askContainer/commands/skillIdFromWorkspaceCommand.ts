/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import {ERRORS} from "../../constants";
import {logAskError} from "../../exceptions";
import {AbstractCommand, CommandContext, Utils} from "../../runtime";
import {checkProfileSkillAccess, getSkillDetailsFromWorkspace} from "../../utils/skillHelper";

export class GetSkillIdFromWorkspaceCommand extends AbstractCommand<string> {
  // eslint-disable-next-line @typescript-eslint/require-await
  async execute(context: CommandContext): Promise<string> {
    checkProfileSkillAccess(context.extensionContext);
    const skillId = getSkillDetailsFromWorkspace(context.extensionContext).skillId;
    if (!Utils.isNonBlankString(skillId)) {
      throw logAskError(`${ERRORS.MISSING_INFO_LOCAL_DEBUG("SkillId")}`);
    }
    return skillId;
  }
  constructor() {
    super("ask.skillIdFromWorkspace");
  }
}
