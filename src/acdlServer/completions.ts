import {
  TypeChecker,
  Node,
  Name,
  isTypeDeclaration,
  ArgumentDeclaration,
  isCall,
  Call,
  Argument,
  isArgument,
  isNameDeclaration,
  Apply,
  AlexaConversations,
  AlexaSchema,
  isUtterance,
  isSlotType,
  isModule,
  isSample,
  isActionDeclaration,
  isTypeReference,
  AlexaConversationsNamespace,
} from "@alexa/acdl";
import {CompletionItem, CompletionItemKind} from "vscode-languageserver/node";
import {KEYWORDS} from "./keywordsProvider";

// When returning [] or undefined from the completion request, VS Code takes over and fuzzy-matches all words in the doc.
// Injecting a single item with an null string (unmatchable) overrides this behavior.
export const NO_COMPLETIONS = [{label: ""}];

/**
 * Function type declaration that serves as a signature for all "isSuggestible" node checks.
 * Refer to usage in {@link getVisibleCompletions}.
 */
interface IsSuggestibleCheckParameter {
  checker: TypeChecker;
  originalNode?: Node;
  nodeToCheck?: Node;
}

type IsSuggestibleCheck = (parameter: IsSuggestibleCheckParameter) => boolean;

/**
 * Returns event declaration nodes that can be suggested to the user.
 * An example would be an UtteranceEvent declaration -
 * ```
 * getWeatherEvent = utterances<CityAndDateType>([
 *     "What's the weather {date} in {cityName}",
 *     "what is the weather {date}"
 *     "What's the weather"
 * ])
 * ```
 */
export const isSuggestibleEventNode: IsSuggestibleCheck = (param) => {
  const {nodeToCheck} = param;
  if (!param.nodeToCheck) return false;

  if (isNameDeclaration(nodeToCheck) && isCall(nodeToCheck.expression)) {
    const apply = param.checker.getApply(nodeToCheck.expression);
    if (apply?.isEventDecl()) return true;
  }

  return false;
};

/**
 * Returns APL or APLA response prompt templates that can be suggested to the user.
 * Examples of the prompt file format can be found {@link https://developer.amazon.com/en-US/docs/alexa/conversations/acdl-response-prompt-files.html here}.
 */
export const isSuggestibleResponseNode: IsSuggestibleCheck = (param) => param.nodeToCheck?.kind === "ResponseTemplate";

const allowedTypesFromSchema = new Set<string>([
  AlexaSchema.Nothing,
  AlexaSchema.Thing,
  AlexaSchema.Boolean,
  AlexaSchema.Number,
  AlexaSchema.List,
]);

export const isSuggestibleTypeNode: IsSuggestibleCheck = (param) => {
  const {nodeToCheck} = param;
  if (!nodeToCheck) return false;

  if (isTypeDeclaration(nodeToCheck) || nodeToCheck?.kind === "SlotType") {
    // filter out types from ac-core
    if (nodeToCheck.name?.name?.startsWith("com.amazon.alexa.ask.conversations")) return false;
    // filter out the unfriendly types from ac-schema
    if (nodeToCheck.name?.name?.startsWith("com.amazon.alexa.schema")) {
      return allowedTypesFromSchema.has(nodeToCheck.name?.name || "");
    }
    return true;
  }
  return false;
};

/**
 * Returns true if the type of utterance node `originalNode` matches the type indicated by TypeDeclaration `nodeToCheck`.
 */
export const isSuggestibleSlotNode: IsSuggestibleCheck = (param) => {
  const {nodeToCheck, originalNode} = param;
  if (!originalNode || !nodeToCheck) return false;

  if (isTypeDeclaration(nodeToCheck) || isSlotType(nodeToCheck)) {
    const suggestibleType = param.checker.getType(originalNode)?.getUtteranceType();

    if (suggestibleType?.name?.name === nodeToCheck.name?.name) return true;
  }
  return false;
};

export const isSuggestibleUserDefinedActionNode: IsSuggestibleCheck = (param) =>
  isActionDeclaration(param.nodeToCheck) && !param.nodeToCheck?.name?.name?.startsWith(AlexaConversationsNamespace);

export const isSuggestibleComplexTypeNode: IsSuggestibleCheck = (param) => {
  const nodeType = param.checker.getType(param.nodeToCheck);
  return isSuggestibleTypeNode(param) && (nodeType?.properties?.length ?? 0) > 0;
};

/**
 * Collection of valid request acts.
 */
export const requestActs: string[] = ["Invoke", "Inform", "Affirm", "Deny"];
export function getRequestActCompletions(): CompletionItem[] | PromiseLike<CompletionItem[]> {
  return requestActs.map((act) => ({
    label: act,
    kind: CompletionItemKind.TypeParameter,
  }));
}

export function getPayloadCompletions(): CompletionItem[] {
  return [
    {
      label: "payload",
      kind: CompletionItemKind.TypeParameter,
    },
  ];
}

/**
 * Collection of valid response acts.
 */
export const responseActs: string[] = ["Bye", "ConfirmAction", "ConfirmArgs", "Notify", "Offer", "ReqMore", "Request"];
export const responseActsChained: string[] = ["Notify", "Offer", "ReqAlt", "ReqMore"];
export function getResponseActCompletions(isChained?: boolean): CompletionItem[] {
  const acts = isChained ? responseActsChained : responseActs;
  return acts.map((act) => ({
    label: `${act}`,
    kind: CompletionItemKind.TypeParameter,
  }));
}

/**
 * Retrieves all nodes visible to `originalNode`.
 * @param checker Type Checker for the module containing `originalNode`.
 * @param originalNode Node from which all visible nodes will be gathered.
 * @param isSuggestible Function that applies filters to the resulting completion set. See {@link IsSuggestibleCheck} for signature.
 * @returns Node[]
 */
export function getVisibleNodes(checker: TypeChecker, originalNode: Node, isSuggestible: IsSuggestibleCheck): Node[] {
  const availableNodes =
    checker
      .getVisibleNames(originalNode)
      ?.valueSeq()
      .reduce((acc, nodeToCheck): Node[] => {
        if (Array.isArray(nodeToCheck)) {
          nodeToCheck.forEach((nodeToCheckElem) => {
            if (isSuggestible({checker, originalNode, nodeToCheck: nodeToCheckElem})) {
              acc.push(nodeToCheckElem);
            }
          });
        } else if (nodeToCheck && nodeToCheck && isSuggestible({checker, originalNode, nodeToCheck})) {
          acc.push(nodeToCheck);
        }
        return acc;
      }, [] as Node[]) || [];

  return availableNodes;
}

/**
 * Retrieves all completion items visible to `originalNode`.
 * @param checker Type Checker for the module containing `originalNode`.
 * @param originalNode Node from which all visible nodes will be gathered.
 * @param isSuggestible Function that applies filters to the resulting completion set. See {@link IsSuggestibleCheck} for signature.
 * @param completionType Defines the type applied to items in the resulting `CompletionItem` set.
 * @returns Array of Visual Studio Code `CompletionItem`s.
 */
export function getVisibleCompletions(
  checker: TypeChecker,
  originalNode: Node,
  isSuggestible: IsSuggestibleCheck,
  completionType: CompletionItemKind,
): CompletionItem[] {
  const availableEvents =
    checker
      .getVisibleNames(originalNode)
      ?.entrySeq()
      .reduce((acc, [key, nodeToCheck]): string[] => {
        if (Array.isArray(nodeToCheck)) {
          nodeToCheck.forEach((nodeToCheckElem) => {
            if (isSuggestible({checker, originalNode, nodeToCheck: nodeToCheckElem})) {
              acc.push(key);
            }
          });
        } else if (isSuggestible({checker, originalNode, nodeToCheck})) {
          acc.push(key);
        }
        return acc;
      }, [] as string[]) || [];

  return availableEvents.map((name) => ({
    label: name,
    kind: completionType,
  }));
}

/**
 * Retrieves an ArgumentDeclaration for a given Argument (named or position-based arguments).
 * Returns undefined if a declaration cannot be found.
 * @param {Apply | undefined} apply
 * @param {Argument | undefined} argument
 * @returns {ArgumentDeclaration | undefined} declaration
 */
export const argumentToArgumentDeclaration = (
  apply: Apply | undefined,
  argument: Argument | undefined,
): ArgumentDeclaration | undefined => {
  if (!apply || !argument) return undefined;

  let argDecl: ArgumentDeclaration | undefined;

  if (apply?.decl?.kind === "ActionDeclaration") {
    // First, try to find the argument declaration by name in case it's a named argument.
    argDecl = apply?.decl.arguments?.find((arg) => arg.name?.name === argument.name?.name);

    // If we missed on name lookup, check if it's a positional argument and find the declaration that way.
    if (!argDecl && argument.index !== undefined) {
      argDecl = apply?.decl.arguments?.[argument.index];
    }
  }
  return argDecl;
};

/**
 * Retrieves the next sequential ArgumentDeclaration for a Call or Argument.
 * @param checker
 * @param {Call | Argument} node
 * @returns {ArgumentDeclaration} For Call nodes, returns the first ArgumentDeclaration.
 * For Arguments, returns the next ArgumentDeclaration in the argument sequence.
 * If a declaration cannot be found or the Argument passed is the final argument, returns undefined.
 */
export function getNextArgumentDeclaration(checker: TypeChecker, node: Call | Argument): ArgumentDeclaration | undefined {
  const apply = isCall(node) ? checker.getApply(node) : checker.getApply(node.context);
  const currentArgDecl = isArgument(node) ? argumentToArgumentDeclaration(apply, node) : undefined;
  if (apply?.decl?.kind === "ActionDeclaration") {
    const targetIndex = currentArgDecl
      ? (apply?.decl?.arguments?.findIndex((elem) => elem.name?.name === currentArgDecl.name?.name) ?? -1) + 1
      : 0;
    return apply?.decl?.arguments?.[targetIndex];
  }

  return undefined;
}

/**
 * Determines if a node is nested within a parameter of an ACDL action. For example, RequestAct and ResponseAct payloads.
 * @param args.node The node we're checking
 * @param args.hasNestedCall Used for recurisve calls while checking up the tree
 * @returns true if node is in a sub-Call within an Action, false otherwise
 */
export function isNestedWithinActionParameter(args): boolean {
  const {node, hasNestedCall} = args;

  if (isModule(node) || !node.context) return false;

  if (isCall(node) && ["response", "expect"].includes(node.name?.name ?? "")) return hasNestedCall;

  if (isCall(node)) return isNestedWithinActionParameter({...args, node: node.context, hasNestedCall: true});

  return isNestedWithinActionParameter({...args, node: node.context});
}

/**
 * Determines if a node is within an if or else conditional
 * @param args.node
 * @returns true if args.node is within an if or else context, false otherwise
 */
export function isWithinConditional(args): boolean {
  const {node} = args;

  if (isModule(node) || !node.context) return false;

  if (["if", "else"].includes(node.name?.name)) return true;

  return isWithinConditional({...args, node: node.context});
}

/**
 * Called when completion is invoked, allows us to add checks to disable auto-completion
 * in certain contexts.
 * @param args.node Node to check for invalid contexts
 * @returns true if we should disable auto-completion based on the context of args.node, false otherwise
 */
export function inInvalidCompletionContext(args): boolean {
  if (isNestedWithinActionParameter({...args, hasNestedCall: false}) || isWithinConditional(args)) return true;

  return false;
}

/**
 * Gets completion items for a node in a PropertyReference, NameReference, Call, or Argument context.
 * @param {Node} node
 * @param checker Type checker associated with `node`
 * @param triggerCharacter Character that triggered the completion request, e.g. '(' or ','
 * @returns {CompletionItem[] | PromiseLike<CompletionItem[]>}
 */
export function getContextualCompletions(
  node: Node,
  checker: TypeChecker,
  triggerCharacter?: string | undefined,
): CompletionItem[] | PromiseLike<CompletionItem[]> {
  const type = checker.getType(node);

  if (node.kind === "PropertyReference" || (type?.isActionDeclaration() && node.kind === "NameReference") || isActionDeclaration(node)) {
    if (type?.isActionDeclaration()) {
      return [{label: "arguments", kind: CompletionItemKind.Property}];
    }

    if (type?.isTypeDeclaration()) {
      const argumentNames = type.properties?.map((arg) => ({
        label: arg.name ?? "",
        kind: CompletionItemKind.Property,
      }));
      return argumentNames ?? [];
    }
  }

  if (node.kind === "NameReference" && node.context?.kind === "NameDeclaration") {
    return [
      ...getVisibleCompletions(checker, node, isSuggestibleUserDefinedActionNode, CompletionItemKind.Method),
      {label: "apl", kind: CompletionItemKind.Keyword},
      {label: "apla", kind: CompletionItemKind.Keyword},
      {label: "variations", kind: CompletionItemKind.Keyword},
      {label: "MultiModalResponse", kind: CompletionItemKind.Keyword},
    ];
  }

  if (isUtterance(node)) {
    const visibleNodes = getVisibleNodes(checker, node, isSuggestibleSlotNode);

    let completionNames = visibleNodes.reduce((acc, nodeElem): string[] => {
      if (isTypeDeclaration(nodeElem) && (nodeElem.properties?.length ?? 0) > 0) {
        nodeElem.properties?.forEach((nodeElemProperty) => {
          acc.push(nodeElemProperty.name?.name ?? "");
        });
      } else if (isSlotType(nodeElem)) {
        acc.push(nodeElem.name?.name ?? "");
      }
      return acc;
    }, [] as string[]);

    // Remove duplicated items
    completionNames = [...new Set(completionNames)];

    return completionNames.map((name) => ({
      label: name,
      kind: CompletionItemKind.Field,
    }));
  }

  if (isCall(node)) {
    const apply = checker.getApply(node);
    if (apply?.isExpect() && apply.argumentDeclarations) {
      const nextArgument = getNextArgumentDeclaration(checker, node);
      const argType = checker.getType(nextArgument);
      const isRequestAct = argType?.isRequestAct() || argType?.getTypeType()?.isRequestAct();
      return isRequestAct ? getRequestActCompletions() : [];
    }
    if (apply?.isResponse() && apply.argumentDeclarations) {
      const nextArgument = getNextArgumentDeclaration(checker, node);
      if (nextArgument && checker.getType(nextArgument)?.name?.name?.toLowerCase() === AlexaConversations.response.toLowerCase()) {
        return getVisibleCompletions(checker, node, isSuggestibleResponseNode, CompletionItemKind.Module);
      }
    }
  }

  if (isArgument(node)) {
    let nodeName = node?.name?.name;

    if (triggerCharacter && triggerCharacter === ",") {
      const nextArgument = getNextArgumentDeclaration(checker, node);
      nodeName = nextArgument?.name?.name;
    }

    const apply = checker.getApply(node.context);
    if (!nodeName && apply?.decl.kind === "ActionDeclaration" && node.index !== undefined) {
      const argDecl = apply?.decl.arguments?.[node.index];
      nodeName = argDecl?.name?.name;
    }

    if (apply?.isExpect()) {
      switch (nodeName) {
        case "act":
          return getRequestActCompletions();
        case "event":
          return getVisibleCompletions(checker, node, isSuggestibleEventNode, CompletionItemKind.Event);
        default:
      }
    }

    if (apply?.isResponse()) {
      switch (nodeName) {
        case "response":
          return getVisibleCompletions(checker, node, isSuggestibleResponseNode, CompletionItemKind.Module);
        case "act":
          return getResponseActCompletions();
        case "nextAct":
          return getResponseActCompletions(true);
        case "payload":
          return getVisibleCompletions(checker, node, isSuggestibleComplexTypeNode, CompletionItemKind.TypeParameter);
        default:
      }
    }
  }

  if (!node.context) return [];

  return getContextualCompletions(node.context, checker, triggerCharacter);
}

/**
 * Determines if a node is at the top level of a module.
 * Tree structure for module scope can be: Current node (Name) -> context (NameReference) -> context (Module)
 *        OR: Current node (Name) -> context (TypeReference) -> context (NameDeclaration) -> context (Module)
 * @param nameNode name node to check
 * @returns true if node is at the top level of a module, false otherwise
 */
export function isNodeAtModuleScope(nameNode: Name): boolean {
  return isModule(nameNode.context?.context) || (isModule(nameNode.context?.context?.context) && isTypeReference(nameNode.context));
}

/**
 * Determines if a node is at the top level of a sample block.
 * Tree structure for sample scope can be: Current node (Name) -> context (NameReference) -> context (Block) -> context (Sample)
 *        OR: Current node (Name) -> context (TypeReference) -> context (NameDeclaration) -> context (Block) -> context (Sample)
 * @param nameNode name node to check
 * @returns true if node is at the top level of a sample block, false otherwise
 */

export function isNodeAtSampleScope(nameNode: Name): boolean {
  return (
    isSample(nameNode.context?.context?.context) ||
    (isSample(nameNode.context?.context?.context?.context) && isTypeReference(nameNode.context))
  );
}

/**
 * Gets global completion items for nodes without a context handled by {@link getContextualCompletions}.
 * @param {Name} nameNode
 * @param checker Type checker associated with `node`
 * @returns {CompletionItem[] | PromiseLike<CompletionItem[]>}
 */
export function getNonContextualCompletions(nameNode: Name, checker: TypeChecker): CompletionItem[] | PromiseLike<CompletionItem[]> {
  // General keywords valid at module or sample level
  if (isNodeAtModuleScope(nameNode) || (isNodeAtSampleScope(nameNode) && nameNode.context.kind !== "PropertyReference")) {
    // If the user is typing without context at the module or sample level, suggest keywords + actions
    let keywordsToSuggest: CompletionItem[] = KEYWORDS.map((keyword) => {
      const completionItem: CompletionItem = {
        label: keyword,
        kind: CompletionItemKind.Keyword,
      };
      return completionItem;
    });

    // if we're in the top level of a sample, it's safe to also suggest user-defined actions
    if (isNodeAtSampleScope(nameNode)) {
      const actionsToSuggest: CompletionItem[] = getVisibleCompletions(
        checker,
        nameNode,
        isSuggestibleUserDefinedActionNode,
        CompletionItemKind.Method,
      );
      keywordsToSuggest = [...keywordsToSuggest, ...actionsToSuggest];
    }
    return keywordsToSuggest;
  }

  if (nameNode.context.kind === "TypeReference") {
    return getVisibleCompletions(checker, nameNode, isSuggestibleTypeNode, CompletionItemKind.TypeParameter);
  }

  return NO_COMPLETIONS;
}
