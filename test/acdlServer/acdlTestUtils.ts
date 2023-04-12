import {Project, loadProject, loadProjectConfig} from "@alexa/acdl";
import * as path from "path";
import {workspace} from "vscode";
import {MarkupContent, Position} from "vscode-languageclient";
import {pathToFileURL} from "url";
import {getFormalizedURI} from "../../src/acdlServer/utils";
import {getHoverContent} from "../../src/acdlServer/acdlServer";

const mockACDLPath = path.resolve(__dirname, "mockACDL");
const mockACDLConversationsPath = path.resolve(mockACDLPath, "skill-package", "conversations");

/**
 * Loads the mockACDL project for testing.
 * @returns the file URI location of the project if loaded successfully, `undefined` if not loaded successfully
 */
export async function initializeTestProject(): Promise<Project> {
  const projectConfig = await loadProjectConfig(mockACDLPath);
  const project = await loadProject(projectConfig);
  return project;
}

/**
 * Retrieves a Position representing the location of `text` in the file indicated by `testFileName`.
 * @param text Text snippet to locate
 * @param testFileName Name of the file to locate `text` in. This file is assumed to be in `./mockACDL/skill-package/conversations`.
 * @returns Position representing the first found instance of `text` in `testFileName`.
 */
export async function getTextPosition(text: RegExp, testFileName: string): Promise<Position | undefined> {
  const testFilePath = path.resolve(mockACDLPath, "skill-package", "conversations", testFileName);

  const textDoc = await workspace.openTextDocument(testFilePath);
  const match = textDoc.getText().match(text);

  if (!match?.index) return undefined;

  return textDoc.positionAt(match.index);
}

/**
 * Retrieves hover text as if the user's cursor was at the first character of the first found instance of `text` in `testFileName`.
 * @param text Text snippet representing where the hover cursor is
 * @param testFileName ACDL file in which we should search for `text` and retrieve hover information
 * @returns The resulting hover text when `text` is hovered
 */
export async function getHoverText(text: RegExp, testFileName: string): Promise<string> {
  const testFilePath = path.resolve(mockACDLConversationsPath, testFileName);

  let pos = await getTextPosition(text, testFilePath);
  if (!pos) throw new Error(`Position of test text '${text.source}' not found in '${testFileName}'`);

  // Increment character by one to better reflect desired location. E.g., without this, getting hover text for `weather` in `response(weather`
  //   gets the hover text for the ( token, not weather.
  pos = {
    line: pos.line,
    character: pos.character + 1,
  };

  const hoverResult = await getHoverContent({
    textDocument: {
      uri: getFormalizedURI(pathToFileURL(testFilePath).toString()),
    },
    position: pos,
  });

  const hoverText = hoverResult ? (hoverResult?.contents as MarkupContent).value : "";

  // Trim ```acdl\n markup from beginning and \n``` markup from end
  return hoverText.substring(8, hoverText.length - 4);
}
