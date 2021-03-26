/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import * as path from 'path';

export function getImagesFolder(context: vscode.ExtensionContext): string {
    return context.asAbsolutePath(path.join('third-party', 'resources', 'from-vscode-icons'));
}