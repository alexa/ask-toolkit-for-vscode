import * as vscode from "vscode";
import { AbstractCommand, CommandContext } from "../../runtime";

import { DeployNonHostedSkillWebview } from "../webViews/deploySkillWebview/deployNonHostedSkillWebview";
import { checkProfileSkillAccess } from "../../utils/skillHelper";
import { Logger } from "../../logger";
import { loggableAskError } from "../../exceptions";

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
            throw loggableAskError(`Cannot open deploy skill view`, err, true);
        }
    }
}
