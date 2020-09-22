import * as vscode from 'vscode';
import * as os from 'os';
import * as child_process from 'child_process';

import { AbstractCommand } from '../../runtime';
import { Logger } from '../../logger';
import { DEFAULT_ENCODING, EXTENSION_ID } from '../../constants';

export class GetToolkitInfoCommand extends AbstractCommand<void> {
    constructor() {
        super('ask.aboutToolkit');
    }

    private getToolkitDetails(): string {
        const osType = os.type();
        const osArch = os.arch();
        const osRelease = os.release();
        const vsCodeVersion = vscode.version;
        const gitVersionUint8Array: Uint8Array = child_process.execSync(
            'git --version');
        const gitVersion = new TextDecoder(DEFAULT_ENCODING).decode(gitVersionUint8Array);
        const pluginVersion: string = vscode.extensions.getExtension(
            EXTENSION_ID)?.packageJSON.version;
        
        const toolkitDetails = `OS: ${osType} ${osArch} ${osRelease}\nVisual Studio Code Version:  ${vsCodeVersion}\nAlexa Skills Toolkit Version: ${pluginVersion}\nGit Version: ${gitVersion}`;
    
        return toolkitDetails;
    }

    async execute(): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}`);
        
        const toolkitEnvDetails = this.getToolkitDetails();
        const result = await vscode.window.showInformationMessage(
            toolkitEnvDetails, { modal: true }, 'Copy');
        if (result === 'Copy') {
            void vscode.env.clipboard.writeText(toolkitEnvDetails);
        }
    }
}
