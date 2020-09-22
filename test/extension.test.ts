"use stirct";

import * as assert from "assert";
import * as vscode from "vscode";
import { EXTENSION_PUBLISHER, EXTENSION_FULL_NAME } from "../src/constants";
import { ext } from "../src/extensionGlobals";

const extensionId = `${EXTENSION_PUBLISHER}.${EXTENSION_FULL_NAME}`;

describe("Alexa Skill Kit Extension", () => {
    let extension: vscode.Extension<any> | undefined;

    it("Extension should be present", () => {
        extension = vscode.extensions.getExtension(extensionId);
        assert.ok(extension !== undefined);
    });

    it("should activate", async () => {
        extension = vscode.extensions.getExtension(extensionId);
        if (extension !== undefined) {
            await extension.activate();
            assert.ok(extension.isActive);
        } else {
            assert.fail("Extension is not available");
        }
    });

    after(() => {
        ext.askGeneralCommands.forEach(command => {
            command.dispose();
        });
    });
});
