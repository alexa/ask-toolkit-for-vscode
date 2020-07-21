import * as vscode from 'vscode';
import * as path from 'path';

export function getImagesFolder(context: vscode.ExtensionContext): string {
    return context.asAbsolutePath(path.join('third-party', 'resources', 'from-vscode-icons'));
}