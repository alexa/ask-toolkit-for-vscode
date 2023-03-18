import * as acdl from "@alexa/acdl";
import {Apply} from "@alexa/acdl/dist/cjs/apply";

export function getMockedTypeChecker(): acdl.TypeChecker {
  return {
    getVisibleNames: () => {},
    isNameReference: () => {},
    resolveNameReferenceToDecl: () => {},
    getType: () => {},
    getApply: () => {},
  } as unknown as acdl.TypeChecker;
}

export function getMockedApplyWithArgs() {
  const mockedArgumentDecl1 = {name: {name: "decl1"}} as acdl.ArgumentDeclaration;
  const mockedArgumentDecl2 = {name: {name: "decl2"}} as acdl.ArgumentDeclaration;
  const mockedArgumentDecl3 = {name: {name: "decl3"}} as acdl.ArgumentDeclaration;
  const argArray = [mockedArgumentDecl1, mockedArgumentDecl2, mockedArgumentDecl3];
  return {
    decl: {
      kind: "ActionDeclaration",
      arguments: argArray,
    },
    argumentDeclarations: argArray,
  };
}

export function getMockedApplyWithoutArgs(): Apply {
  return {
    decl: {
      kind: "ActionDeclaration",
      arguments: undefined,
    },
  } as Apply;
}
