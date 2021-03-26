/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import { EventEmitter } from "vscode";
import { PluginTreeItem, Resource } from "../runtime";

export const onSkillConsoleViewChangeEventEmitter: EventEmitter<
    PluginTreeItem<Resource> | undefined
> = new EventEmitter<PluginTreeItem<Resource> | undefined>();

export const onWorkspaceOpenEventEmitter: EventEmitter<PluginTreeItem<Resource> | undefined> = new EventEmitter<
    PluginTreeItem<Resource> | undefined
>();
