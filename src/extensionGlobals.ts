import { ExtensionContext } from "vscode";

import { GenericCommand } from "../src/runtime/lib/API";

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
}
