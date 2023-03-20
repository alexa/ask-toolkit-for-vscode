import {createSandbox} from "sinon";
import assert from "assert";
import * as acdl from "@alexa/acdl";
import {Location} from "vscode";
import {pathToFileURL} from "url";
import {Range} from "vscode-languageserver/node";
import {getReferenceDefinition, getRange} from "../../src/acdlServer/definition";
import {createMockNode, createSrcLocation, createMockTypeChecker} from "../definitionUtils";

describe("Go to Definition", () => {
  const sbox = createSandbox();
  after(() => {
    sbox.restore();
  });

  it("Should return valid getRange position offsets", () => {
    const fqn = "com.weatherbot.types.testType";
    const typeName = "testType";
    const declNameLoc = createSrcLocation(10, 1, 10, 8);
    const expected = Range.create(
      declNameLoc.begin.line - 1,
      declNameLoc.begin.character,
      declNameLoc.begin.line - 1,
      declNameLoc.begin.character + typeName.length,
    );
    const mockNode = {name: fqn, uri: "types.acdl", loc: declNameLoc} as acdl.Name;
    const range = getRange(mockNode);
    assert.deepStrictEqual(range, expected);
  });

  describe("should change cursor position when go to definition is checked", () => {
    let mockTypeChecker;
    beforeEach(() => {
      mockTypeChecker = createMockTypeChecker();
    });
    it("type reference", () => {
      const declNameLoc = createSrcLocation(2, 2, 2, 10);
      const refNameLoc = createSrcLocation(20, 2, 20, 10);
      const name = "TestType";
      const declNode = createMockNode<acdl.TypeDeclaration>("TypeDeclaration", "com.project.types.TestType", "types.acdl", declNameLoc);
      const refNode = createMockNode<acdl.TypeReference>("TypeReference", name, "test.acdl", refNameLoc);

      sbox.stub(mockTypeChecker, "lookupName").withArgs(refNode, refNode.name).returns(declNode);
      const expected = {
        uri: pathToFileURL("types.acdl").toString(),
        range: Range.create(
          declNameLoc.begin.line - 1,
          declNameLoc.begin.character,
          declNameLoc.begin.line - 1,
          declNameLoc.begin.character + name.length,
        ),
      } as unknown as Location;

      const result = getReferenceDefinition(refNode, mockTypeChecker);
      assert.deepStrictEqual(result, expected);
    });

    it("name reference", () => {
      const declNameLoc = createSrcLocation(2, 2, 2, 5);
      const refNameLoc = createSrcLocation(20, 4, 20, 7);
      const name = "foo";
      const declNode = createMockNode<acdl.NameDeclaration>("NameDeclaration", "foo", "types.acdl", declNameLoc);
      const refNode = createMockNode<acdl.NameReference>("NameReference", "fooreference", "test.acdl", refNameLoc);

      sbox.stub(mockTypeChecker, "lookupName").withArgs(refNode, refNode.name).returns(declNode);
      const expected = {
        uri: pathToFileURL("types.acdl").toString(),
        range: Range.create(
          declNameLoc.begin.line - 1,
          declNameLoc.begin.character,
          declNameLoc.begin.line - 1,
          declNameLoc.begin.character + name.length,
        ),
      } as unknown as Location;

      const result = getReferenceDefinition(refNode, mockTypeChecker);
      assert.deepStrictEqual(result, expected);
    });

    it("call", () => {
      const declNameLoc = createSrcLocation(2, 2, 2, 5);
      const refNameLoc = createSrcLocation(20, 2, 20, 5);
      const name = "api";
      const declNode = createMockNode<acdl.ActionDeclaration>("ActionDeclaration", "com.project.types.api", "types.acdl", declNameLoc);
      const refNode = createMockNode<acdl.Call>("Call", name, "test.acdl", refNameLoc);

      sbox.stub(mockTypeChecker, "lookupName").withArgs(refNode, refNode.name).returns(declNode);
      const expected = {
        uri: pathToFileURL("types.acdl").toString(),
        range: Range.create(
          declNameLoc.begin.line - 1,
          declNameLoc.begin.character,
          declNameLoc.begin.line - 1,
          declNameLoc.begin.character + name.length,
        ),
      } as unknown as Location;

      const result = getReferenceDefinition(refNode, mockTypeChecker);
      assert.deepStrictEqual(result, expected);
    });

    it("cannot go to definition - undefined loc", () => {
      const refNameLoc = createSrcLocation(20, 2, 20, 5);
      const declNode = createMockNode<acdl.TypeDeclaration>(
        "TypeDeclaration",
        "com.amazon.alexa.ask.conversations.Invoke",
        "types.acdl",
        undefined,
      );
      const refNode = createMockNode<acdl.NameReference>("NameReference", "Invoke", "test.acdl", refNameLoc);
      sbox.stub(mockTypeChecker, "lookupName").withArgs(refNode, refNode.name).returns(declNode);

      const result = getReferenceDefinition(refNode, mockTypeChecker);
      assert.strictEqual(result, undefined);
    });
  });
});
