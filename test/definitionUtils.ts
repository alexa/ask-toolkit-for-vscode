import * as acdl from "@alexa/acdl";
import {uinteger} from "vscode-languageclient";
import {SourceLocation} from "@alexa/acdl";
import {Position} from "vscode-languageserver/node";

export function createMockNode<T>(typeStr: string, name: string, uri: string, loc: acdl.SourceLocation | undefined): T {
  return {
    kind: typeStr,
    name: {name, uri, loc} as acdl.Name,
  } as unknown as T;
}

export function createSrcLocation(
  startLine: uinteger,
  startCharacter: uinteger,
  endLine: uinteger,
  endCharacter: uinteger,
): SourceLocation {
  return {
    begin: {line: startLine, character: startCharacter},
    end: {line: endLine, character: endCharacter},
  };
}

export function createMockTypeChecker(): acdl.TypeChecker {
  return {
    lookupName: () => {},
  } as unknown as acdl.TypeChecker;
}

export function convertACDLToVSCodeSrcPosition(line: number, char: number): Position {
  return {line: line - 1, character: char};
}

export function convertVSCodeToACDLSrcPosition(line: number, char: number): Position {
  return {line: line + 1, character: char};
}
