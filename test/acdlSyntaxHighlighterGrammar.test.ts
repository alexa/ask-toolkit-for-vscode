/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
var assert = require("assert");
var grammar = require("../../languages/acdl/syntaxes/acdl.tmLanguage.json");

describe("Patterns", function () {
  it("should return correct number of patterns", function () {
    assert.strictEqual(14, grammar.patterns.length);
  });
  it("should return correct patterns", function () {
    assert.deepStrictEqual(
      [
        {include: "#utterances"},
        {include: "#assignment"},
        {include: "#conditionals"},
        {include: "#actionDeclaration"},
        {include: "#imports"},
        {include: "#types"},
        {include: "#dialog"},
        {include: "#constant"},
        {include: "#strings"},
        {include: "#keywords"},
        {include: "#storage"},
        {include: "#actions"},
        {include: "#variablePattern"},
        {include: "#comments"},
      ],
      Object.values(grammar.patterns),
    );
  });
});

describe("Keyword Patterns", function () {
  const keywords = grammar.repository.keywords;
  it("should return correct number of keyword patterns", function () {
    assert.strictEqual(4, Object.values(keywords.patterns).length);
  });
  it("should match control keyword pattern", function () {
    assert.deepStrictEqual(["keyword.control.acdl", "\\b(optional|default|else)\\b"], Object.values(keywords.patterns[0]));
  });
  it("should match operator comparison keyword pattern", function () {
    assert.deepStrictEqual(["keyword.operator.comparison.acdl", "(==|!=|<=|>=|>|<)"], Object.values(keywords.patterns[1]));
  });
  it("should match arithematic keyword pattern", function () {
    assert.deepStrictEqual(["keyword.operator.arithmetic.acdl", "(\\+|-|%|\\*|\\\\)"], Object.values(keywords.patterns[2]));
  });
  it("should match other keyword pattern", function () {
    assert.deepStrictEqual(
      ["keyword.other.acdl", "\\b(dialog|sample|type|action|import|namespace)\\b"],
      Object.values(keywords.patterns[3]),
    );
  });
});

describe("String Patterns", function () {
  const stringMatch = grammar.repository.strings;
  it("should return correct string pattern", function () {
    assert.deepStrictEqual(
      [
        ["name", "string.quoted.double.acdl"],
        ["begin", '"'],
        ["end", '"'],
      ],
      Object.entries(stringMatch),
    );
  });
});

describe("Constant Patterns", function () {
  const constant = grammar.repository.constant;
  it("should return correct number of constant patterns", function () {
    assert.strictEqual(2, Object.values(constant.patterns).length);
  });
  it("should match numeric constant pattern", function () {
    assert.deepStrictEqual(["constant.numeric.acdl", "([0-9]+(\\.[0-9]+)?)"], Object.values(constant.patterns[0]));
  });
  it("should match language constant pattern", function () {
    assert.deepStrictEqual(["constant.language.acdl", "\\b(true|false)\\b"], Object.values(constant.patterns[1]));
  });
});

describe("Comment Patterns", function () {
  const comment = grammar.repository.comments;
  it("should return correct number of comment patterns", function () {
    assert.strictEqual(2, Object.values(comment.patterns).length);
  });
  it("should match comment line pattern", function () {
    assert.deepStrictEqual(
      [
        ["name", "comment.line.acdl"],
        ["match", "//.*$"],
      ],
      Object.entries(comment.patterns[0]),
    );
  });
  it("should match comment block pattern", function () {
    assert.deepStrictEqual(
      [
        ["name", "comment.block.acdl"],
        ["begin", "/\\*"],
        ["end", "\\*/"],
      ],
      Object.entries(comment.patterns[1]),
    );
  });
});

describe("Assignment Patterns", function () {
  const assignment = grammar.repository.assignment;

  it("should return correct number of assignment patterns", function () {
    assert.strictEqual(6, Object.values(assignment.patterns).length);
  });
  it("should match assignment pattern", function () {
    assert.deepStrictEqual(
      [
        {
          name: "constant.numeric.acdl",
          match: "([0-9]+(\\.[0-9]+)?)",
        },
        {include: "#actions"},
        {
          match: "([A-Za-z_][\\w$]*)\\s*(\\.)",
          name: "entity.name.variable.acdl",
        },
        {include: "#strings"},
        {include: "#variablePattern"},
        {include: "#comments"},
      ],
      assignment.patterns,
    );
  });
  it("should match assignment begin pattern", function () {
    assert.deepStrictEqual("([A-Za-z_\\-0-9]*)?(\\s)*=", assignment.begin);
    assert.deepStrictEqual({"1": {name: "entity.name.variable.acdl"}}, assignment.beginCaptures);
  });
});

describe("Action declaration Patterns", function () {
  const actionDeclaration = grammar.repository.actionDeclaration;

  it("should return correct number of action declaration patterns", function () {
    assert.strictEqual(4, Object.values(actionDeclaration.patterns).length);
  });
  it("should match action pattern", function () {
    assert.deepStrictEqual(
      [
        {include: "#actions"},
        {
          match: "<([A-Za-z_0-9\\.\\-]+)>",
          name: "entity.name.type.acdl",
        },
        {
          match: "(([A-Za-z_0-9\\-]+[\\.]{1})*)([A-Za-z_0-9\\-]+)",
          name: "entity.name.type.acdl",
        },
        {
          include: "#comments",
        },
      ],
      actionDeclaration.patterns,
    );
  });
  it("should match action begin pattern", function () {
    assert.deepStrictEqual("(action){1}\\s+", actionDeclaration.begin);
    assert.deepStrictEqual(
      {
        "1": {name: "keyword.other.acdl"},
      },
      actionDeclaration.beginCaptures,
    );
  });
});

describe("Imports Patterns", function () {
  const imports = grammar.repository.imports;
  it("should return correct number of import patterns", function () {
    assert.strictEqual(2, Object.values(imports.patterns).length);
  });
  it("should match import pattern", function () {
    assert.deepStrictEqual(
      [
        {
          match: "([A-Za-z_\\-\\.0-9])+",
          name: "support.type.acdl",
        },
        {
          include: "#comments",
        },
      ],
      imports.patterns,
    );
  });
  it("should match import begin pattern", function () {
    assert.deepStrictEqual("((import|namespace){1}[\\s+])", imports.begin);
    assert.deepStrictEqual({"0": {name: "keyword.other.acdl"}}, imports.beginCaptures);
  });
});

describe("Action Patterns", function () {
  const actions = grammar.repository.actions;

  it("should return correct number of actions patterns", function () {
    assert.strictEqual(4, Object.values(actions.patterns).length);
  });
  it("should match actions pattern", function () {
    assert.deepStrictEqual(
      [
        {
          name: "constant.numeric.acdl",
          match: "([0-9]+(\\.[0-9]+)?)",
        },
        {
          include: "#variablePattern",
        },
        {
          include: "#strings",
        },
        {
          include: "#comments",
        },
      ],
      actions.patterns,
    );
  });
  it("should match actions begin pattern", function () {
    assert.deepStrictEqual("(([A-Za-z0-9_\\-]+[\\.]{1})*)([A-Za-z0-9_\\-]+)(\\s*)(\\()", actions.begin);
    assert.deepStrictEqual(
      {
        "1": {name: "entity.name.function.acdl"},
        "3": {name: "entity.name.function.acdl"},
        "5": {name: "punctuation.definition.parameters.begin.bracket.round.acdl"},
      },
      actions.beginCaptures,
    );
  });
});

describe("Types Patterns", function () {
  const types = grammar.repository.types;

  it("should return correct number of types patterns", function () {
    assert.strictEqual(3, Object.values(types.patterns).length);
  });
  it("should match types pattern", function () {
    assert.deepStrictEqual([{include: "#keywords"}, {include: "#typeVariablePattern"}, {include: "#comments"}], types.patterns);
  });
  it("should match types begin pattern", function () {
    assert.deepStrictEqual(
      "(type){1}\\s+(([A-Za-z_0-9\\-]+[\\.]{1})*)([A-Za-z_0-9\\-]+)\\s*([:]{1}\\s*(([A-Za-z_0-9\\-]+[\\.]{1}))*([A-Za-z_0-9\\-]+))?\\s*({)",
      types.begin,
    );
    assert.deepStrictEqual(
      {
        "1": {name: "keyword.other.acdl"},
        "2": {name: "entity.name.type.acdl"},
        "4": {name: "entity.name.type.acdl"},
        "5": {name: "entity.name.type.acdl"},
      },
      types.beginCaptures,
    );
  });
});
