import { ExtensionContext } from "vscode";

import { GenericCommand, AbstractWebView, AbstractTreeView } from "../src/runtime/lib/API";
import { SkillPackageWatcher } from "./askContainer/fileSystem/skillPackageWatcher";
/**
 * Namespace for common variables used globally in the extension.
 * All variables here must be initialized in the activate() method of extension.ts
 */
export namespace ext {
    export let context: ExtensionContext;
    /**
     * Commands which will be available when extension is activated
     */
    export let askGeneralCommands: GenericCommand[];

    /**
     * Commands which will be available when extension is activated
     * And when a skill is detected
     */
    export let askSkillCommands: GenericCommand[];

    /**
     * Webviews which are registered in this extension
     */
    export const webViews: AbstractWebView[] = [];

    /**
     * TreeViews which are registered in this extension
     */
    export const treeViews: AbstractTreeView[] = [];


    export let skillPackageWatcher: SkillPackageWatcher;
}
