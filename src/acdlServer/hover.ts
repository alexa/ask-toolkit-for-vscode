import {
  getName,
  TypeDeclaration,
  ActionDeclaration,
  NameDeclaration,
  TypeChecker,
  isCall,
  isNameReference,
  isNameDeclaration,
  TypeReference,
  ResponseTemplate,
} from "@alexa/acdl";
import {Environment} from "@alexa/acdl/dist/cjs/environment";
import {isEmpty} from "ramda";
import * as fs from "fs";
import {APLAContent, getAPLAContent, stripNamespace} from "./utils";

/**
 * Filter JSDoc comment to only get the content
 */
export function getCommentContent(comment: string | undefined): string | undefined {
  const formattedJsdoc = comment
    ?.split("\n")
    .map((lineStr) =>
      // regexp matches patterns that - start with '/**' OR end with '*/' OR start with '*'OR space chars at the start or at the end
      lineStr.replace(/^\/\*{2}\s*|\s*\*\/$|^\s*\*\s*|^\s*|\s*$/g, ""),
    )
    .filter((str) => !isEmpty(str));
  return formattedJsdoc?.join("\n");
}

/**
 * Checks each comment line that starts with @param and highlights the following word (similar to how it looks in typescript hover)
 */
export function formatComment(decl): string[] | undefined {
  const content = getCommentContent(decl.comment);
  return content?.split("\n").map((commentLine) => {
    const splitComment = commentLine.split(" ");
    let isParam = false;
    let i = 0;
    while (i < splitComment.length) {
      // markdown for word after @param
      if (isParam) {
        splitComment[i] = `- \`${splitComment[i]}\``;
        isParam = false;
      }
      if (splitComment[i].startsWith("@param")) {
        isParam = true;
      }
      i += 1;
    }
    // the extra space characters adds a newline in markdown
    return `${splitComment.join(" ")}  `;
  });
}

export function getInstantiatedGenericType(typeName: string | undefined, genericEnv: Environment): string | undefined {
  return stripNamespace(genericEnv[typeName ?? ""]?.name?.name) ?? typeName;
}

export function getFormattedTypeArguments(type: TypeReference | undefined, genericEnv?: Environment): string {
  const typeArguments = type?.arguments?.map((arg) => getInstantiatedGenericType(stripNamespace(arg?.name?.name), genericEnv ?? {}) ?? "");
  return typeArguments ? `<${typeArguments.join(", ")}>` : "";
}

/**
 * Returns TypeDeclaration info using the format below followed by optional JSDoc comments
 * 1) type TypeName {
 *      <optional> type property
 *      ....
 *    }
 */
export function getTypeHoverContent(typeDecl: TypeDeclaration): string[] {
  const typeDeclarationProperties = typeDecl.properties?.map((property) => {
    const typeName = property?.type?.name?.name ? getName(property?.type?.name?.name) : property?.type;
    const typeArguments = getFormattedTypeArguments(property?.type);
    return property.optional
      ? ` optional ${typeName}${typeArguments} ${property.name?.name}`
      : ` ${typeName}${typeArguments} ${property.name?.name}`;
  });

  const genericArgumentContent = typeDecl.genericArguments
    ? `<${typeDecl.genericArguments.map((arg) => stripNamespace(arg?.name?.name) ?? "").join(", ")}>`
    : "";

  const hoverContent =
    typeDecl.extensions?.length === 1
      ? [
          "```acdl",
          `${stripNamespace(typeDecl?.name?.name)}${genericArgumentContent} : type ${stripNamespace(typeDecl.extensions[0].name?.name)}`,
          "```",
        ]
      : [
          "```acdl",
          `type ${stripNamespace(typeDecl?.name?.name)}${genericArgumentContent} {`,
          ...(typeDeclarationProperties ?? []),
          "}",
          "```",
        ];
  return [...hoverContent, ...(formatComment(typeDecl) ?? [])];
}

/**
 * Returns ActionDeclaration info using the format below followed by optional JSDoc comments
 * 1) Hover over "getWeather" in "getWeather(type.arguments.city,type.arguments.date)" -> "(action) getWeather(.....) : WeatherReturnType"
 */
export function getActionHoverContent(nodeDef: ActionDeclaration, genericEnv: Environment, returnTypeName: string | undefined): string[] {
  const args: string[] = nodeDef.arguments
    ? nodeDef.arguments.map(
        (arg) =>
          `${stripNamespace(arg.type?.name?.name)}${getFormattedTypeArguments(arg.type, genericEnv)} ${stripNamespace(arg.name?.name)}`,
      )
    : [];
  const actionDecl = `(action) ${stripNamespace(nodeDef.name?.name)}(${args.join(", ")}) : ${
    getInstantiatedGenericType(returnTypeName, genericEnv) ?? "Nothing"
  }`;
  const hoverContent = ["```acdl", actionDecl, "```"];
  return [...hoverContent, ...(formatComment(nodeDef) ?? [])];
}

/**
 * Get type information for nameDeclaration and formats it in the following format followed by optional JSDoc comments:
 * 1) Hover over "val" in "val = api(...args)"  -> "val : type returnTypeOfapi"
 * 2) Hover over "val" in "val = nameReference" -> "val : type typeOfNamereference"
 */
export function getNameDeclarationContent(nodeDef: NameDeclaration, checker: TypeChecker) {
  let type: string = "";
  if (nodeDef.expression) {
    if (isCall(nodeDef.expression)) {
      type = checker.getApply(nodeDef.expression)?.getReturnType()?.shortName ?? "";
    } else if (isNameReference(nodeDef.expression)) {
      const node = checker.lookupName(nodeDef.expression, nodeDef.expression.name);
      type = isNameDeclaration(node) ? stripNamespace(node?.name?.name) ?? "" : "";
    }
  }
  const hoverContent: string[] = ["```acdl", `${stripNamespace(nodeDef.name?.name)} : type ${type}`, "```"];
  return [...hoverContent, ...(formatComment(nodeDef) ?? [])];
}

/**
 * Gets hover information (type/name and string content) for apla response templates and formats it in the following format:
 * 1) Hover over any response template, e.g. 'confirm_addon_apla' in 'response(confirm_addon_apla, ConfirmAction {actionName = cookingAPI})'
 *     Shows -> (ResponseTemplate) confirm_addon_apla
 *           -> "what are the add ons?"
 */
export function getResponseTemplateContent(nodeDef: ResponseTemplate) {
  const templateUri: string = `${nodeDef.templateUri}/document.json`;
  const templateContent: string = fs.readFileSync(templateUri, "utf8");
  const templateObj = JSON.parse(templateContent);
  const aplaContent: APLAContent[] = getAPLAContent(templateObj);

  // In cases where we can't retrieve the contents yet (like APL), just return an empty array so we don't show hover info
  const aplaContentDisplay =
    aplaContent.length === 0
      ? "No content preview available."
      : aplaContent.map((content) => `"${content.text}"\n${content.when}`).join("\n");

  const hoverContent: string[] = ["```acdl", `(ResponseTemplate) ${nodeDef.name} \n${aplaContentDisplay}`, "```"];
  return [...hoverContent, ...(formatComment(nodeDef) ?? [])];
}
