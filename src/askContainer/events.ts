import { EventEmitter } from "vscode";
import { PluginTreeItem, Resource } from "../runtime";

export const onSkillConsoleViewChangeEventEmitter: EventEmitter<
    PluginTreeItem<Resource> | undefined
> = new EventEmitter<PluginTreeItem<Resource> | undefined>();

export const onWorkspaceOpenEventEmitter: EventEmitter<PluginTreeItem<Resource> | undefined> = new EventEmitter<
    PluginTreeItem<Resource> | undefined
>();
