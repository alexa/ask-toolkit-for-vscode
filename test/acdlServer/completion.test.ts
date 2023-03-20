import {createSandbox} from "sinon";
import assert from "assert";
import * as acdl from "@alexa/acdl";
import {CompletionItemKind} from "vscode-languageserver/node";
import {Map} from "immutable";
import {Argument, ArgumentDeclaration, Call} from "@alexa/acdl";
import * as completions from "../../src/acdlServer/completions";
import {getMockedApplyWithArgs, getMockedApplyWithoutArgs, getMockedTypeChecker} from "./completionUtils";

describe("completions:", () => {
  describe("getVisibleCompletions [Type Nodes]", () => {
    const sbox = createSandbox();

    after(() => {
      sbox.restore();
    });

    it("should return empty array [] if nameNode passed has no visible names", () => {
      const mockedNameNode = {} as acdl.Name;
      const mockedLexicalScope = Map();
      const mockedTypeChecker = getMockedTypeChecker();
      sbox.stub(mockedTypeChecker, "getVisibleNames").withArgs(mockedNameNode).returns(mockedLexicalScope);

      const expectedRes = [];
      const res = completions.getVisibleCompletions(
        mockedTypeChecker,
        mockedNameNode,
        completions.isSuggestibleTypeNode,
        CompletionItemKind.TypeParameter,
      );

      assert.deepStrictEqual(res, expectedRes);
    });

    it("should return empty array [] if visibleNames have no TypeDeclaration node or SlotType node", () => {
      const mockedNameNode = {} as acdl.Name;
      const mockedLexicalScope = Map({
        foo: {} as acdl.Node,
        bar: {} as acdl.Node,
      });
      const mockedTypeChecker = getMockedTypeChecker();
      sbox.stub(mockedTypeChecker, "getVisibleNames").withArgs(mockedNameNode).returns(mockedLexicalScope);

      const expectedRes = [];
      const res = completions.getVisibleCompletions(
        mockedTypeChecker,
        mockedNameNode,
        completions.isSuggestibleTypeNode,
        CompletionItemKind.TypeParameter,
      );

      assert.deepStrictEqual(res, expectedRes);
    });

    it("should return the SlotType names if visibleNames have SlotType node", () => {
      const mockedNameNode = {} as acdl.Name;
      const mockedLexicalScope = Map({
        foo: {} as acdl.Node,
        bar: {kind: "SlotType"} as acdl.Node,
      });
      const mockedTypeChecker = getMockedTypeChecker();
      sbox.stub(mockedTypeChecker, "getVisibleNames").withArgs(mockedNameNode).returns(mockedLexicalScope);

      const expectedRes = [
        {
          label: "bar",
          kind: CompletionItemKind.TypeParameter,
        },
      ];
      const res = completions.getVisibleCompletions(
        mockedTypeChecker,
        mockedNameNode,
        completions.isSuggestibleTypeNode,
        CompletionItemKind.TypeParameter,
      );

      assert.deepStrictEqual(res, expectedRes);
    });

    it("should return the type names if visibleNames have TypeDeclaration that is not from ac-core", () => {
      const mockedNameNode = {} as acdl.Name;
      const mockedLexicalScope = Map({
        foo: {
          name: {
            name: "com.amazon.alexa.ask.conversations.foo",
          },
          kind: "TypeDeclaration",
        } as acdl.Node,
        bar: {} as acdl.Node,
        baz: {
          name: {
            name: "bilibilibalabala",
          },
          kind: "TypeDeclaration",
        },
      });
      const mockedTypeChecker = getMockedTypeChecker();
      sbox.stub(mockedTypeChecker, "getVisibleNames").withArgs(mockedNameNode).returns(mockedLexicalScope);

      const expectedRes = [
        {
          label: "baz",
          kind: CompletionItemKind.TypeParameter,
        },
      ];
      const res = completions.getVisibleCompletions(
        mockedTypeChecker,
        mockedNameNode,
        completions.isSuggestibleTypeNode,
        CompletionItemKind.TypeParameter,
      );

      assert.deepStrictEqual(res, expectedRes);
    });

    it("should return the type names if visibleNames have TypeDeclaration that is not from allowed types from ac-schema", () => {
      const mockedNameNode = {} as acdl.Name;
      const mockedTypeChecker = getMockedTypeChecker();
      const mockedLexicalScope = Map({
        foo: {
          name: {
            name: "com.amazon.alexa.schema.foo",
          },
          kind: "TypeDeclaration",
        } as acdl.Node,
        bar: {} as acdl.Node,
        Number: {
          name: {
            name: "com.amazon.alexa.schema.Number",
          },
          kind: "TypeDeclaration",
        },
      });
      sbox.stub(mockedTypeChecker, "getVisibleNames").withArgs(mockedNameNode).returns(mockedLexicalScope);

      const expectedRes = [
        {
          label: "Number",
          kind: CompletionItemKind.TypeParameter,
        },
      ];
      const res = completions.getVisibleCompletions(
        mockedTypeChecker,
        mockedNameNode,
        completions.isSuggestibleTypeNode,
        CompletionItemKind.TypeParameter,
      );

      assert.deepStrictEqual(res, expectedRes);
    });
  });

  describe("action declarations", () => {
    const sbox = createSandbox();

    after(() => {
      sbox.restore();
    });

    it("should return 'arguments' on action name reference", () => {
      const mockedNameRefNode = {kind: "NameReference"} as acdl.NameReference;
      const mockedType = {
        properties: [{name: "filler1"}, {name: "arguments"}, {name: "filler2"}],
        kind: "ActionDeclaration",
        isActionDeclaration: () => {},
      };
      const mockedTypeChecker = getMockedTypeChecker();
      sbox.stub(mockedTypeChecker, "isNameReference").withArgs(mockedNameRefNode).returns(true);
      sbox.stub(mockedType, "isActionDeclaration").returns(true);
      sbox.stub(mockedTypeChecker, "getType").withArgs(mockedNameRefNode).returns(mockedType);

      const expectedRes = [
        {
          label: "arguments",
          kind: CompletionItemKind.Property,
        },
      ];
      const res = completions.getContextualCompletions(mockedNameRefNode, mockedTypeChecker);

      assert.deepStrictEqual(res, expectedRes);
    });

    it("should return empty result on action name reference when 'arguments' is not present", () => {
      const mockedNameRefNode = {kind: "NameReference"} as acdl.NameReference;
      const mockedType = {
        properties: [{name: "filler1"}, {name: "filler2"}],
        kind: "ActionDeclaration",
        isActionDeclaration: () => {},
      };
      const mockedTypeChecker = getMockedTypeChecker();
      sbox.stub(mockedTypeChecker, "isNameReference").withArgs(mockedNameRefNode).returns(true);
      sbox.stub(mockedType, "isActionDeclaration").returns(true);
      sbox.stub(mockedTypeChecker, "getType").withArgs(mockedNameRefNode).returns(mockedType);

      const expectedRes = [
        {
          label: "arguments",
          kind: CompletionItemKind.Property,
        },
      ];
      const res = completions.getContextualCompletions(mockedNameRefNode, mockedTypeChecker);

      assert.deepStrictEqual(res, expectedRes);
    });

    it("should return all argument names for a property reference", () => {
      const mockedPropertyRefNode = {kind: "PropertyReference"} as acdl.PropertyReference;
      const mockedType = {
        properties: [{name: "prop1"}, {name: "prop2"}, {name: "prop3"}],
        isTypeDeclaration: () => {},
        isActionDeclaration: () => {},
      };
      const mockedTypeChecker = getMockedTypeChecker();
      sbox.stub(mockedTypeChecker, "getType").withArgs(mockedPropertyRefNode).returns(mockedType);
      sbox.stub(mockedType, "isActionDeclaration").returns(false);
      sbox.stub(mockedType, "isTypeDeclaration").returns(true);

      const expectedRes = [
        {
          label: "prop1",
          kind: CompletionItemKind.Property,
        },
        {
          label: "prop2",
          kind: CompletionItemKind.Property,
        },
        {
          label: "prop3",
          kind: CompletionItemKind.Property,
        },
      ];
      const res = completions.getContextualCompletions(mockedPropertyRefNode, mockedTypeChecker);

      assert.deepStrictEqual(res, expectedRes);
    });
  });

  describe("expect actions", () => {
    describe("isSuggestibleEventNode", () => {
      const sbox = createSandbox();

      after(() => {
        sbox.restore();
      });

      it("should return true if the node is an event declaration", () => {
        const mockedNode = {
          expression: {
            kind: "Call",
          },
          kind: "NameDeclaration",
        };
        const mockedTypeChecker = getMockedTypeChecker();
        const mockedApply = {
          isEventDecl: () => {},
        };
        sbox.stub(acdl, "isNameDeclaration").withArgs(mockedNode).returns(true);
        sbox.stub(acdl, "isCall").withArgs(mockedNode.expression).returns(true);
        sbox.stub(mockedApply, "isEventDecl").returns(true);
        sbox.stub(mockedTypeChecker, "getApply").withArgs(mockedNode.expression).returns(mockedApply);

        assert.deepStrictEqual(
          completions.isSuggestibleEventNode({checker: mockedTypeChecker, nodeToCheck: mockedNode as acdl.Node}),
          true,
        );
      });
    });

    describe("getVisibleCompletions [Event Nodes]", () => {
      const sbox = createSandbox();

      after(() => {
        sbox.restore();
      });

      it("should return empty array if node has no visible names", () => {
        const mockedNode = {} as acdl.Node;
        const mockedLexicalScope = Map();
        const mockedTypeChecker = getMockedTypeChecker();
        sbox.stub(mockedTypeChecker, "getVisibleNames").withArgs(mockedNode).returns(mockedLexicalScope);

        const expectedRes = [];
        const res = completions.getVisibleCompletions(
          mockedTypeChecker,
          mockedNode,
          completions.isSuggestibleEventNode,
          CompletionItemKind.Event,
        );

        assert.deepStrictEqual(res, expectedRes);
      });
    });

    describe("getRequestActCompletions", () => {
      it("should return all request acts", () => {
        const expectedResult = completions.requestActs.map((act) => ({
          label: act,
          kind: CompletionItemKind.TypeParameter,
        }));
        assert.deepStrictEqual(completions.getRequestActCompletions(), expectedResult);
      });
    });
  });

  describe("argumentToArgumentDeclaration", () => {
    const sbox = createSandbox();

    const testName = "testName";
    const mockedArgumentDecl = {name: {name: testName}} as ArgumentDeclaration;
    const mockedApply = {
      decl: {
        kind: "ActionDeclaration",
        arguments: [{name: {name: "notIt"}}, mockedArgumentDecl, {name: {name: "meNeither"}}],
      },
    } as acdl.Apply;

    after(() => {
      sbox.restore();
    });

    it("should return the argument declaration that matches the argument's name", () => {
      const mockedArgument = {name: {name: testName}} as Argument;
      assert.deepStrictEqual(completions.argumentToArgumentDeclaration(mockedApply, mockedArgument), mockedArgumentDecl);
    });

    it("should return the argument declaration that matches the argument's position when name is not found", () => {
      const mockedArgument = {index: 1} as Argument;
      assert.deepStrictEqual(completions.argumentToArgumentDeclaration(mockedApply, mockedArgument), mockedArgumentDecl);
    });
  });

  describe("getNextArgumentDeclaration", () => {
    const sbox = createSandbox();
    const mockedTypeChecker = getMockedTypeChecker();
    const mockedCall = {
      kind: "Call",
    } as Call;
    const mockedApplyWithArgs = getMockedApplyWithArgs();
    const mockedApplyWithNoArgs = getMockedApplyWithoutArgs();

    afterEach(() => {
      sbox.restore();
    });

    it("should return the next sequential argument when an argument is provided", () => {
      const mockedArgument = {
        kind: "Argument",
        context: mockedCall,
      } as Argument;
      const mockedArgumentDecl = {name: {name: "decl1"}} as ArgumentDeclaration;

      const expectedResult = mockedApplyWithArgs.decl.arguments[1];
      sbox.stub(mockedTypeChecker, "getApply").withArgs(mockedCall).returns(mockedApplyWithArgs);
      sbox.stub(completions, "argumentToArgumentDeclaration").withArgs(mockedApplyWithArgs, mockedArgument).returns(mockedArgumentDecl);
      const res = completions.getNextArgumentDeclaration(mockedTypeChecker, mockedArgument);
      assert.deepStrictEqual(res, expectedResult);
    });

    it("should return the first argument when a Call with arguments is provided", () => {
      const expectedResult = mockedApplyWithArgs.decl.arguments[0];
      sbox.stub(mockedTypeChecker, "getApply").withArgs(mockedCall).returns(mockedApplyWithArgs);
      assert.deepStrictEqual(completions.getNextArgumentDeclaration(mockedTypeChecker, mockedCall), expectedResult);
    });

    it("should return undefined when the provided Call has no arguments", () => {
      const expectedResult = undefined;
      sbox.stub(mockedTypeChecker, "getApply").withArgs(mockedCall).returns(mockedApplyWithNoArgs);
      assert.deepStrictEqual(completions.getNextArgumentDeclaration(mockedTypeChecker, mockedCall), expectedResult);
    });

    it("should return undefined when provided Argument is the final sequential argument", () => {
      const mockedArgument = {
        context: mockedCall,
        kind: "Argument",
      } as Argument;
      const mockedArgumentDecl = {name: {name: "decl3"}} as ArgumentDeclaration;
      const expectedResult = undefined;
      sbox.stub(mockedTypeChecker, "getApply").withArgs(mockedCall).returns(mockedApplyWithArgs);
      sbox.stub(completions, "argumentToArgumentDeclaration").withArgs(mockedApplyWithArgs, mockedArgument).returns(mockedArgumentDecl);
      assert.deepStrictEqual(completions.getNextArgumentDeclaration(mockedTypeChecker, mockedArgument), expectedResult);
    });
  });

  describe("response actions", () => {
    describe("isSuggestibleResponseNode", () => {
      const sbox = createSandbox();

      after(() => {
        sbox.restore();
      });

      it("should return true if the node is a ResponseTemplate", () => {
        const mockedNode = {
          kind: "ResponseTemplate",
        };
        const mockedTypeChecker = getMockedTypeChecker();

        assert.deepStrictEqual(
          completions.isSuggestibleResponseNode({checker: mockedTypeChecker, nodeToCheck: mockedNode as acdl.Node}),
          true,
        );
      });

      it("should return false if the node is undefined", () => {
        const mockedTypeChecker = getMockedTypeChecker();

        assert.deepStrictEqual(completions.isSuggestibleResponseNode({checker: mockedTypeChecker}), false);
      });
    });

    describe("getVisibleCompletions [Response Nodes]", () => {
      const sbox = createSandbox();

      after(() => {
        sbox.restore();
      });

      it("should return empty array if node has no visible names", () => {
        const mockedNode = {} as acdl.Node;
        const mockedLexicalScope = Map();
        const mockedTypeChecker = getMockedTypeChecker();
        sbox.stub(mockedTypeChecker, "getVisibleNames").withArgs(mockedNode).returns(mockedLexicalScope);

        const expectedRes = [];
        const res = completions.getVisibleCompletions(
          mockedTypeChecker,
          mockedNode,
          completions.isSuggestibleResponseNode,
          CompletionItemKind.Module,
        );

        assert.deepStrictEqual(res, expectedRes);
      });
    });

    describe("getResponseActCompletions", () => {
      it("when no parameters are provided, should return all response acts", () => {
        const expectedResult = completions.responseActs.map((act) => ({
          label: `${act}`,
          kind: CompletionItemKind.TypeParameter,
        }));
        assert.deepStrictEqual(completions.getResponseActCompletions(), expectedResult);
      });

      it("when a 'true' parameter is provided, should return all chained response acts", () => {
        const expectedResult = completions.responseActsChained.map((act) => ({
          label: `${act}`,
          kind: CompletionItemKind.TypeParameter,
        }));
        assert.deepStrictEqual(completions.getResponseActCompletions(true), expectedResult);
      });
    });

    describe("isSuggestibleComplexTypeNode", () => {
      const sbox = createSandbox();

      after(() => {
        sbox.restore();
      });

      it("should return true if the node is a TypeDeclaration with properties", () => {
        const mockedNode = {
          kind: "TypeDeclaration",
        };
        const mockedTypeChecker = getMockedTypeChecker();
        const mockedType = {
          properties: [{name: "filler1"}, {name: "filler2"}],
        };

        sbox.stub(mockedTypeChecker, "getType").withArgs(mockedNode).returns(mockedType);
        assert.deepStrictEqual(
          completions.isSuggestibleComplexTypeNode({checker: mockedTypeChecker, nodeToCheck: mockedNode as acdl.Node}),
          true,
        );
      });

      it("should return false if the node is undefined", () => {
        const mockedTypeChecker = getMockedTypeChecker();

        assert.deepStrictEqual(completions.isSuggestibleComplexTypeNode({checker: mockedTypeChecker}), false);
      });
    });

    describe("getVisibleCompletions [Payload Nodes]", () => {
      const sbox = createSandbox();

      after(() => {
        sbox.restore();
      });

      it("should return empty array if node has no visible names", () => {
        const mockedNode = {} as acdl.Node;
        const mockedLexicalScope = Map();
        const mockedTypeChecker = getMockedTypeChecker();
        sbox.stub(mockedTypeChecker, "getVisibleNames").withArgs(mockedNode).returns(mockedLexicalScope);

        const expectedRes = [];
        const res = completions.getVisibleCompletions(
          mockedTypeChecker,
          mockedNode,
          completions.isSuggestibleComplexTypeNode,
          CompletionItemKind.Module,
        );

        assert.deepStrictEqual(res, expectedRes);
      });
    });
  });

  describe("utterance slot completions", () => {
    const sbox = createSandbox();

    after(() => {
      sbox.restore();
    });

    describe("isSuggestibleSlotNode", () => {
      it("should return true if nodeToCheck is a type declaration and the type name matches originalNode's type", () => {
        const slotTypeName = "TestName";

        const mockedOriginalNode = {};

        const mockedNodeToCheck = {
          kind: "TypeDeclaration",
          name: {name: slotTypeName},
        };

        const mockedNodeType = {
          getUtteranceType: () => {},
        };

        const mockedUtteranceType = {
          name: {name: slotTypeName},
        };

        const mockedTypeChecker = getMockedTypeChecker();

        sbox.stub(mockedTypeChecker, "getType").withArgs(mockedOriginalNode).returns(mockedNodeType);
        sbox.stub(mockedNodeType, "getUtteranceType").returns(mockedUtteranceType);

        assert.deepStrictEqual(
          completions.isSuggestibleSlotNode({
            checker: mockedTypeChecker,
            originalNode: mockedOriginalNode as acdl.Node,
            nodeToCheck: mockedNodeToCheck as acdl.Node,
          }),
          true,
        );
      });
    });

    describe("getContextualCompletions [Slot Nodes]", () => {
      it("should filter out duplicates when multiple nodes have properties with the same name", () => {
        const slotTypeName = "TestName";

        const mockedNameNode = {
          kind: "Utterance",
        } as acdl.Node;

        const mockedNodeType = {
          getUtteranceType: () => {},
          isActionDeclaration: () => {},
          isTypeDeclaration: () => {},
        };

        const mockedUtteranceType = {
          name: {name: slotTypeName},
        };

        const mockedLexicalScope = Map({
          node1: {
            name: {
              name: slotTypeName,
            },
            properties: [{name: {name: "testname"}}, {name: {name: "duplicatename"}}],
            kind: "TypeDeclaration",
          } as acdl.Node,
          node2: {
            name: {
              name: slotTypeName,
            },
            properties: [{name: {name: "testname2"}}, {name: {name: "duplicatename"}}],
            kind: "TypeDeclaration",
          } as acdl.Node,
        });
        const mockedTypeChecker = getMockedTypeChecker();
        sbox.stub(mockedTypeChecker, "getVisibleNames").withArgs(mockedNameNode).returns(mockedLexicalScope);
        sbox.stub(mockedTypeChecker, "getType").withArgs(mockedNameNode).returns(mockedNodeType);
        sbox.stub(mockedNodeType, "getUtteranceType").returns(mockedUtteranceType);
        sbox.stub(mockedNodeType, "isActionDeclaration").returns(false);
        sbox.stub(mockedNodeType, "isTypeDeclaration").returns(false);

        const expectedRes = [
          {
            label: "testname",
            kind: CompletionItemKind.Field,
          },
          {
            label: "duplicatename",
            kind: CompletionItemKind.Field,
          },
          {
            label: "testname2",
            kind: CompletionItemKind.Field,
          },
        ];
        const res = completions.getContextualCompletions(mockedNameNode, mockedTypeChecker);

        assert.deepStrictEqual(res, expectedRes);
      });
    });
  });
});
