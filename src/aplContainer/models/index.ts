/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import * as vscode from "vscode";

/**
 * Interface of APL resource
 *
 * @export
 * @interface AplResource
 */
export interface AplResource {
  sources?: string;
  document: string;
  datasources?: string;
}

/**
 * Interface of APL Sample Template QuickPickItem
 *
 * @export
 * @interface SampleTemplateQuickPickItem
 */
export interface SampleTemplateQuickPickItem extends vscode.QuickPickItem {
  id: string;
}
