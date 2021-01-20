import * as vscode from "vscode";


import { Logger } from "../../../logger";
import { AbstractWebView } from "../../../runtime";

import { AbstractDeploySkillManager } from "./abstractDeploySkillManager";


export class DeployNonHostedSkillManager extends AbstractDeploySkillManager {
    private currentHash: string;

    constructor(context: vscode.ExtensionContext, skillFolderWs: vscode.Uri, currentHash: string) {
        super(context, skillFolderWs);
        this.currentHash = currentHash;
    }

    async deploySkill(view: AbstractWebView, isForce?: boolean, eTag?: string): Promise<void> {
        Logger.verbose("Calling method: deploySkill");

        await this.deploySkillPackage(view, isForce, eTag, this.currentHash);
    }
}
