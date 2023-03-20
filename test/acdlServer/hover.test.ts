import assert from "assert";
import {formatComment, getCommentContent} from "../../src/acdlServer/hover";

describe("Hover", () => {
  it("should get empty string from jsdoc", () => {
    const jsdoc = `/**
        */`;
    const result = getCommentContent(jsdoc);
    const expected = ``;
    assert.strictEqual(result, expected);
  });
  it("should get comment content from jsdoc", () => {
    const jsdoc = `/**
        * random text
        */`;
    const result = getCommentContent(jsdoc);
    const expected = `random text`;
    assert.strictEqual(result, expected);
  });

  it("should get comment content from jsdoc - multiline", () => {
    const jsdoc = `/**
        * random text
        * multiline comment
        */`;
    const result = getCommentContent(jsdoc);
    const expected = `random text\nmultiline comment`;
    assert.strictEqual(result, expected);
  });

  it("should highlight word after @param in jsdoc", () => {
    const decl = {
      comment: `/**
        * @param arg arg description
        */`,
    };
    const result = formatComment(decl);
    const expected = ["@param - `arg` arg description  "];
    assert.deepStrictEqual(result, expected);
  });
});
