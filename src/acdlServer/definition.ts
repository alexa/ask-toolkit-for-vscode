import {
  TypeChecker,
  Name,
  isTypeDeclaration,
  NameReference,
  isNameDeclaration,
  isActionDeclaration,
  PropertyReference,
  TypeReferenceParent,
  isPropRef,
  PropertyReferenceExpression,
  getName,
  isCall,
  Named,
  isNameReference,
  Utterance,
  NameDeclaration,
} from "@alexa/acdl";
import {Location, Range} from "vscode-languageserver/node";
import {pathToFileURL} from "url";
import {convertACDLToVSCodeSrcPosition} from "../../test/definitionUtils";

/**
 * Converts node's loc into corresponding position in vscode
 */
export function getRange(node: Name | NameDeclaration): Range | undefined {
  if (node.loc && node.name) {
    const start = convertACDLToVSCodeSrcPosition(node.loc.begin.line, node.loc.begin.character);
    const end = isNameDeclaration(node)
      ? convertACDLToVSCodeSrcPosition(node.loc.end.line, node.loc.end.character)
      : convertACDLToVSCodeSrcPosition(node.loc.begin.line, node.loc.begin.character + getName(node.name).length);
    return {start, end};
  }
  return undefined;
}

/**
 * Resolves property reference into parent NameReference's name
 * ``
 * .city from ActionName.arguments.city -> ActionName
 * ``
 */
export function getNameReferenceName(expr?: PropertyReferenceExpression): string | undefined {
  if (expr?.kind === "NameReference") {
    return expr?.name?.name;
  }
  if (expr?.kind === "PropertyReference") {
    return getNameReferenceName(expr.expression);
  }
  return undefined;
}

export function getReferenceDefinition(
  node: TypeReferenceParent | NameReference | PropertyReference,
  checker: TypeChecker,
): Location | undefined {
  const nodeDef = isPropRef(node)
    ? checker.lookupName(node, PropertyReference.tryResolveQualifiedName(node)) ?? checker.lookupName(node, getNameReferenceName(node))
    : checker.lookupName(node, node.name);

  if (nodeDef) {
    if (isNameDeclaration(nodeDef) || isActionDeclaration(nodeDef) || isTypeDeclaration(nodeDef)) {
      const nameNode = nodeDef.name;

      if (!nameNode) return undefined;

      const locationRange = isNameDeclaration(nodeDef) ? getRange(nodeDef) : getRange(nameNode);

      // In cases of a NameDeclaration with a NameReference expression, we need to adjust the end character to the
      // end of the NameReference or else the definition is truncated to the first letter of the NameReference name.
      // e.g., definition of "name = name2" appears as "name = n"
      if (isNameDeclaration(nodeDef) && isNameReference(nodeDef.expression) && locationRange)
        locationRange.end.character = nodeDef.expression.loc?.end.character ?? locationRange.end.character;

      return nameNode.uri && locationRange ? Location.create(pathToFileURL(nameNode.uri).toString(), locationRange) : undefined;
    }

    if (nodeDef.kind === "ResponseTemplate") {
      return Location.create(`${nodeDef.templateUri}/document.json`, Range.create(0, 0, 0, 0));
    }

    if (nodeDef.kind === "SlotType") {
      const path = node.uri?.split("conversations")[0];

      return path
        ? Location.create(
            pathToFileURL(`${path}/interactionModels/custom/${nodeDef.locales[0].replace("_", "-")}.json`).toString(),
            Range.create(0, 0, 0, 0),
          )
        : undefined;
    }
  }
  return undefined;
}

/**
 * Gets the location of return type declarations of calls and name references
 */
export function getNamedExpressionReturnTypeLocation(node: Named, checker: TypeChecker, slotTypeName?: Name): Location | undefined {
  if (isCall(node)) {
    const apply = checker.getApply(node);
    const genericArg = node.genericArguments?.[0];
    const [lookupNode, name] = apply?.isUtterances() && genericArg ? [genericArg, genericArg.name] : [node, apply?.getReturnType()?.name];
    const nodeDef = checker.lookupName(lookupNode, name);

    if (isTypeDeclaration(nodeDef) && nodeDef.name) {
      let locationRange = getRange(nodeDef.name);
      if (slotTypeName) {
        nodeDef.properties?.forEach((property) => {
          if (property.name && property.name.name === slotTypeName.name) {
            locationRange = getRange(property.name);
          }
        });
      }
      return nodeDef.name.uri && locationRange ? Location.create(pathToFileURL(nodeDef.name.uri).toString(), locationRange) : undefined;
    }
  } else if (isNameReference(node)) {
    const nodeDef = checker.lookupNameReference(node);
    if (isNameDeclaration(nodeDef) && nodeDef.expression) {
      return getNamedExpressionReturnTypeLocation(nodeDef.expression, checker);
    }
  }
  return undefined;
}

/**
 * Gets the location of slot type declarations
 */
export function getUtteranceSlotTypeDefinition(node: Utterance, checker: TypeChecker, name: Name): Location | undefined {
  let found: any = node;

  while (!checker.getApply(found)?.isUtterances()) {
    found = found.context;
  }
  if (found.name?.name === "utterances") {
    return getNamedExpressionReturnTypeLocation(found, checker, name);
  }
  return undefined;
}
