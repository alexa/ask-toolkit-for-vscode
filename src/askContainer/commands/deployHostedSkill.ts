import * as vscode from "vscode";
import { AbstractCommand, CommandContext } from "../../runtime";

import { DeployHostedSkillWebview } from "../webViews/deploySkillWebview/deployHostedSkillWebview";
import { checkProfileSkillAccess } from "../../utils/skillHelper";
import { Logger } from "../../logger";
import { loggableAskError } from "../../exceptions";

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
            throw loggableAskError(`Cannot open deploy skill view`, err, true);
        }
    }
}
