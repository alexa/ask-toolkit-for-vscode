import {ACDLLexer} from "@alexa/acdl/dist/cjs/syntax/ACDLLexer";

// valid keywords tart with a-zA-Z, end with a-zA-Z, no space
const validKeywordCharacters = /^[a-zA-Z]+$/;

// keywords that are excluded from the list
const excludedKeywords = ["multimodal"];

// extra keywords that are not part of the ACDLLexer
const extraKeywords = ["confirmAction", "confirmArgs", "ensure", "expect", "response", "skill", "utterances"];

// TODO: How to get the builtin expressions?
// eslint-disable-next-line @typescript-eslint/dot-notation
export const KEYWORDS = ACDLLexer["_LITERAL_NAMES"].reduce((acc, literalName) => {
  // ACDLLexer['_LITERAL_NAMES'] contains items that are undefined, filter them out.
  if (typeof literalName === "string") {
    // string items are wrapped with single quote, change "'namespace'" to "namespace"
    const sanitizedLiteralName = literalName.replace(/[']/g, "");
    // filter out the literaNames that are symbols like ">"
    if (validKeywordCharacters.test(sanitizedLiteralName) && !excludedKeywords.includes(sanitizedLiteralName)) {
      acc.push(sanitizedLiteralName);
    }
  }
  return acc;
}, extraKeywords);
