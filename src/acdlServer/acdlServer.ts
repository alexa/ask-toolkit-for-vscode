import {
  Project,
  loadProject,
  loadProjectConfig,
  loadACDLFile,
  Module,
  SourceFile,
  ParseError,
  validateProject,
  TypeChecker,
  Name,
  isTypeDeclaration,
  isActionDeclaration,
  isNameDeclaration,
  PropertyReference,
  isCall,
  ErrorCategory,
} from "@alexa/acdl";
import path from "path";
import findUp = require("find-up");
import {TextDocument} from "vscode-languageserver-textdocument";
import {
  InitializeParams,
  Connection,
  Position,
  Location,
  DefinitionParams,
  TypeDefinitionParams,
  HoverParams,
  CompletionItem,
  CompletionParams,
  Hover,
  CompletionItemKind,
  DiagnosticSeverity,
} from "vscode-languageserver/node";

import {pathToFileURL} from "url";
import {getFormalizedURI, toRange, NodeType} from "./utils";

import {getContextualCompletions, getNonContextualCompletions, inInvalidCompletionContext, NO_COMPLETIONS} from "./completions";
import {getReferenceDefinition, getNamedExpressionReturnTypeLocation, getUtteranceSlotTypeDefinition} from "./definition";
import {convertVSCodeToACDLSrcPosition} from "../../test/definitionUtils";
import {getTypeHoverContent, getActionHoverContent, getNameDeclarationContent, getResponseTemplateContent} from "./hover";

/**
 * A Map that maps projectURI to a "Project" instance
 */
const uriToProjects = {} as Record<string, Project>;

let connection: Connection;

/**
 * Find the uri of the root Project for a file
 * @param uri uri to a file
 * @returns {Promise} uri to the root of the Project,
 */
const getProjectUri = async (uri: string): Promise<string | void> => {
  const nearestPackageFile = await findUp(["package.json", "ask-resources.json"], {cwd: path.dirname(uri)});
  const nearestPackageFolder = await findUp(["skill-package"], {cwd: path.dirname(uri), type: "directory"});

  if (nearestPackageFile && nearestPackageFile.length > (nearestPackageFolder?.length ?? 0))
    return getFormalizedURI(pathToFileURL(path.dirname(nearestPackageFile)).toString());

  if (nearestPackageFolder && nearestPackageFolder.length > (nearestPackageFile?.length ?? 0))
    return getFormalizedURI(pathToFileURL(path.dirname(nearestPackageFolder)).toString());

  return undefined;
};

/**
 * Retrieve a Project that's already loaded from the "uriToProjects" dictionary
 * @param projectURI
 * @returns {Project} retrieve a Project that's already loaded from the "uriToProjects" dictionary
 */
const getProject = (projectURI: string): Project => uriToProjects[projectURI];

/**
 * Get all Projects loaded/cached
 * @returns {Array} All the "Projects" loaded
 */
const getProjects = (): Project[] => Object.values(uriToProjects);

/**
 * Get all Projects that a file belongs to given its uri
 * @param uri uri of a file
 * @returns Corresponding Projects loaded for that file
 */

const findProjects = (uri: string): Project[] => getProjects().filter((p) => uri.startsWith(p.config.rootDir)) || [];

/**
 * Find if there is a "Name" node for the current position in the .acdl file in the AST based.
 */
async function findNameNode(uri: string, position: Position): Promise<[Name?, TypeChecker?]> {
  const formalizedURI = getFormalizedURI(uri);
  const projectURI = (await getProjectUri(formalizedURI)) || "";
  const project = getProject(projectURI);

  if (project) {
    const checker = project.getTypeChecker();
    const updatedPosition = convertVSCodeToACDLSrcPosition(position.line, position.character);
    // Any type reference, definition look up must be on a valid "name" node,
    // token like "," "(" and ")" makes no sense to have these information.
    // "nameNode" is a "node" for the current expression that's valid in the language grammar.
    const nameNode = checker.findName(formalizedURI, updatedPosition);
    if (nameNode) {
      return [nameNode, checker];
    }
  }

  return [undefined, undefined];
}

/**
 * initialize this module, inject connection etc.
 * @param params
 * @param injectedConnection
 */
export const initialize = (params: InitializeParams, injectedConnection: Connection) => {
  connection = injectedConnection;
  connection.console.log("ACDL Server initialized");
};

/**
 * Load a Project for a file, if there is no corresponding Project loaded already.
 * @param uri uri of a file
 * @returns Project corresponding to that file.
 */
export const addProject = async (uri: string): Promise<Project> => {
  const projectUri = await getProjectUri(uri);
  connection.console.log(`ACDL Project loaded at ${projectUri}`);

  // FIXME: handle this better
  if (!projectUri) {
    throw new Error("No project directory can be found");
  }

  // If no project loaded, load the project and add it to the cache
  if (!uriToProjects[projectUri]) {
    const projectConfig = await loadProjectConfig(projectUri);
    const project = await loadProject(projectConfig);
    uriToProjects[projectUri] = project;
    return project;
  }
  return uriToProjects[projectUri];
};

export const enum UpdateProjectResult{
  UPDATED,
  ADDED,
  NONE
}

/**
 * Updating corresponding Projects loaded using the textDocument form a file.
 * @param textDocument
 */
export const updateProject = async (textDocument: TextDocument): Promise<UpdateProjectResult> => {
  const uri = getFormalizedURI(textDocument.uri);
  const file: SourceFile<Module | undefined> = await loadACDLFile(
    // baseDir was a leaky thing to add to source file :(
    "" /* HACK: baseDir is only needed in the decompiler but that change broke the LSP, for now we'll hack this here but we need to fix this properly */,
    uri,
    textDocument.getText(),
  );
  const projectUri = await getProjectUri(uri);

  // move this logic out of this function to onDidChangeContent hook?
  if (projectUri) {
    const project = getProject(projectUri);
    // File path must be normalized or the lookup on project.update() might miss due to wrong-directional slashes ('\' vs '/')
    file.uri = path.normalize(file.uri);
    if (project) {
      project.update(file);
      return UpdateProjectResult.UPDATED;
    } 

    await addProject(uri);
    return UpdateProjectResult.ADDED;
  }

  return UpdateProjectResult.NONE;
};

export const validate = async (textDocument: TextDocument): Promise<Error | undefined> => {
  const formalizedURI = getFormalizedURI(textDocument.uri);

  try {
    findProjects(formalizedURI).forEach((project) => {
      // Get all validation errors for the project
      const projectErrors = validateProject(project);

      // make a map to record an error is thrown at which module
      const moduleToErrors = new Map<string, ParseError[]>();
      projectErrors.forEach((error) => {
        const {uri} = error;
        if (uri) {
          if (moduleToErrors.has(uri)) {
            moduleToErrors.get(uri)?.push(error);
          } else {
            moduleToErrors.set(uri, [error]);
          }
        }
      });

      for (const file of project.sourceModules) {
        const moduleErrors = moduleToErrors.get(file.uri) ?? [];
        const fileErrors = file.errors ?? [];

        const diagnostics = [...moduleErrors, ...fileErrors]
          .filter((error) => error.loc !== undefined)
          .map((error) => ({
            message: error.message,
            range: toRange(error.loc!),
            code: error.code.code,
            severity: error.code.category === ErrorCategory.Warning ? DiagnosticSeverity.Warning : DiagnosticSeverity.Error,
          }));

        connection.sendDiagnostics({
          uri: file.uri,
          diagnostics,
        });
      }

      return [];
    });
  } catch (error: any) {
    connection.console.log(`Error running validations: ${error.message}`);
    return error;
  }
  return undefined;
};

export const getDefinition = async (definitionParams: DefinitionParams): Promise<Location | undefined> => {
  const {uri} = definitionParams.textDocument;
  const [node, checker] = await findNameNode(uri, definitionParams.position);
  if (node && checker) {
    const {context} = node;
    switch (context.kind) {
      case NodeType.TypeReference:
      case NodeType.TypeDeclaration:
      case NodeType.NameDeclaration:
      case NodeType.NameReference:
      case NodeType.PropertyReference:
      case NodeType.Call:
      case NodeType.ActionDeclaration:
      case NodeType.TypeProperty:
      case NodeType.TypeParameter: {
        return getReferenceDefinition(context, checker);
      }
      default: {
        break;
      }
    }
    return undefined;
  }

  return undefined;
};

export const getTypeDefinition = async (typeDefinitionParams: TypeDefinitionParams): Promise<Location | undefined> => {
  const {uri} = typeDefinitionParams.textDocument;
  const [node, checker] = await findNameNode(uri, typeDefinitionParams.position);

  if (node && checker) {
    const {context} = node;
    switch (context.kind) {
      case "TypeReference":
      case "TypeDeclaration":
        return getReferenceDefinition(context, checker);
      case "NameDeclaration":
        if (context.expression) {
          return getNamedExpressionReturnTypeLocation(context.expression, checker);
        }
        break;
      case "Utterance":
        return getUtteranceSlotTypeDefinition(context, checker, node);
      default: {
        break;
      }
    }
  }

  return undefined;
};

export const getContextualHoverInfo = (nameNode: Name, checker: TypeChecker) => {
  let hoverContent: string[] = [];
  const {context} = nameNode;

  switch (context.kind) {
    case NodeType.TypeReference:
    case NodeType.TypeDeclaration: {
      const typeDecl = isTypeDeclaration(context) ? context : checker.lookupTypeReference(context);

      if (isTypeDeclaration(typeDecl)) {
        hoverContent = [...hoverContent, ...getTypeHoverContent(typeDecl)];
      }
      break;
    }
    case NodeType.Call:
    case NodeType.ActionDeclaration: {
      // if context is action declaraton get its return type otherwise when its a call, lookup its action declaration
      const genericEnv = (isCall(context) ? checker.getApply(context)?.getGenericEnvironment() : {}) ?? {};

      const [node, returnTypeName] = isActionDeclaration(context)
        ? [context, context.returnType?.name?.name]
        : [checker.lookupName(context, context.name), checker.getApply(context)?.getReturnType()?.shortName];

      if (isActionDeclaration(node)) {
        hoverContent = [...hoverContent, ...getActionHoverContent(node, genericEnv, returnTypeName)];
      }
      if (isTypeDeclaration(node) && node.name) {
        return getContextualHoverInfo(node.name, checker);
      }
      break;
    }

    case NodeType.PropertyReference: {
      const flattenedNode = checker.lookupName(context, PropertyReference.tryResolveQualifiedName(context));
      if ((isNameDeclaration(flattenedNode) || isActionDeclaration(flattenedNode)) && flattenedNode.name) {
        return getContextualHoverInfo(flattenedNode.name, checker);
      }
      if (flattenedNode?.kind === "ResponseTemplate") {
        hoverContent = [...hoverContent, ...getResponseTemplateContent(flattenedNode)];
      }
      break;
    }

    case NodeType.NameReference:
    case NodeType.Argument:
    case NodeType.NameDeclaration: {
      const nameDecl = checker.lookupName(context, context.name);

      if (isNameDeclaration(nameDecl)) {
        hoverContent = [...hoverContent, ...getNameDeclarationContent(nameDecl, checker)];
      } else if (nameDecl?.kind === "ResponseTemplate") {
        hoverContent = [...hoverContent, ...getResponseTemplateContent(nameDecl)];
      } else if (isTypeDeclaration(nameDecl) && nameDecl.name) {
        return getContextualHoverInfo(nameDecl.name, checker);
      } else if (isActionDeclaration(nameDecl) && nameDecl.name) {
        return getContextualHoverInfo(nameDecl.name, checker);
      }
      break;
    }

    default: {
      break;
    }
  }
  return {
    contents: {
      value: hoverContent.join("\n"),
      kind: "markdown",
    },
  };
};

export const getHoverContent = async (hoverParams: HoverParams): Promise<Hover | undefined> => {
  const {uri} = hoverParams.textDocument;
  const [nameNode, checker] = await findNameNode(uri, hoverParams.position);

  if (nameNode && checker) {
    return getContextualHoverInfo(nameNode, checker);
  }
  return undefined;
};

/** TODO: Remove this if https://github.com/alexa/ask-ac/issues/1293 is ever corrected.
 * This is a workaround for the above issue. It attempts to piece together a property
 * request on actions or the `argument` propety of actions in cases where the node
 * has been corrupted.
 *
 * Occurs for the following syntax (cursor position indicated by ^):
 *   args = getWeather.^
 *   response(weather_apla, Notify {...
 *
 * The parser parses this into an invalid AST name node of "getWeather.response"
 */

const tryGetCompletionsFromCorruptedNode = async (node: Name, checker: TypeChecker): Promise<CompletionItem[] | undefined> => {
  if (!node.name) return undefined;

  const originalNameComponents = node.name?.split(".");
  originalNameComponents.pop();
  const baseNode = checker.lookupName(node, originalNameComponents[0]);

  // Requesting properties directly on action, e.g. `getWeather.`
  if (isActionDeclaration(baseNode) && originalNameComponents.length === 1 && baseNode) {
    const completions = await getContextualCompletions(baseNode, checker);
    return completions;
  }

  // Requesting properties on `argument` property of action, e.g. `getWeather.arguments.`
  if (isActionDeclaration(baseNode) && baseNode.arguments && originalNameComponents[1] === "arguments") {
    return baseNode.arguments?.map((arg) => ({
      label: arg.name?.name ?? "",
      kind: CompletionItemKind.Property,
    }));
  }

  return undefined;
};

export const getCompletion = async (completionParams: CompletionParams): Promise<CompletionItem[] | undefined> => {
  const {
    position,
    textDocument: {uri},
  } = completionParams;
  const [nameNode, checker] = await findNameNode(uri, position);

  if (nameNode && checker) {
    if (inInvalidCompletionContext({node: nameNode, checker})) {
      return NO_COMPLETIONS;
    }

    let contextualCompletions = await getContextualCompletions(nameNode, checker, completionParams.context?.triggerCharacter);

    // TODO : Remove this block if https://github.com/alexa/ask-ac/issues/1293 is ever corrected.
    if (contextualCompletions.length === 0 && nameNode?.name?.includes(".")) {
      const repairedCompletions = await tryGetCompletionsFromCorruptedNode(nameNode, checker);
      return repairedCompletions && repairedCompletions.length > 0 ? repairedCompletions : NO_COMPLETIONS;
    }

    if (contextualCompletions.length > 0) return contextualCompletions;

    contextualCompletions = await getNonContextualCompletions(nameNode, checker);

    if (contextualCompletions.length > 0) return contextualCompletions;
  }

  return NO_COMPLETIONS;
};
