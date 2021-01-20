import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as os from 'os';
import { EXTENSION_ID } from '../constants';
import { Logger } from '../logger';

export function resolveUserAgent(): string {
    Logger.verbose(`Calling method: resolveUserAgent`);
    const pluginVersion: string = vscode.extensions.getExtension(
        EXTENSION_ID)?.packageJSON.version;
    const vsCodeVersion = vscode.version;
    const osType = os.type();
    const osArch = os.arch();
    const gitVersionUint8Array: Buffer = child_process.execSync(
        'git --version');
    const gitVersion = gitVersionUint8Array.toString().replace("\n", "");
    return `askToolkit/${pluginVersion} VSCode/${vsCodeVersion} ${osType}/${osArch} Git/${gitVersion}`
}