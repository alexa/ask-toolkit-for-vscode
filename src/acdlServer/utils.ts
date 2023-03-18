import {SourceLocation} from "@alexa/acdl";
import {Range} from "vscode-languageserver/node";
import process from "process";
import path from "path";
import {CompletionItem} from "vscode-languageserver";

class ShowFullACDLNamespaceState {
  public showFullNamespace: boolean = false;
}

export const showFullACDLNamespaceState = new ShowFullACDLNamespaceState();

export const getFormalizedURI = (uri: string): string => {
  let formalizedUri: string = path.normalize(decodeURIComponent(uri).replace("file://", ""));

  // remove leading slashes on Windows
  if (process.platform === "win32") {
    formalizedUri = formalizedUri.replace(/^\/+/, "");
    formalizedUri = formalizedUri.replace(/^\\+/, "");
  }
  return formalizedUri;
};

export const toRange = (location: SourceLocation): Range => ({
  start: {line: location.begin.line - 1, character: location.begin.character},
  end: {line: location.end.line - 1, character: location.end.character},
});

export enum NodeType {
  TypeDeclaration = "TypeDeclaration",
  ActionDeclaration = "ActionDeclaration",
  NameDeclaration = "NameDeclaration",
  Call = "Call",
  TypeReference = "TypeReference",
  PropertyReference = "PropertyReference",
  NameReference = "NameReference",
  Argument = "Argument",
  Utterance = "Utterance",
  TypeParameter = "TypeParameter",
  TypeProperty = "TypeProperty",
}

// Strips full namespace from ACDL names. 'amazon.alexa.myObject' => 'myObject'.
// Does not strip the namespace if the user has the 'ask/show Full ACDL Namespace' configuration setting turned on.
export const stripNamespace = (fqn: string | undefined): string | undefined =>
  showFullACDLNamespaceState.showFullNamespace || !fqn ? fqn : fqn.substring(fqn.lastIndexOf(".") + 1);

// Prepares a completion list for display by stripping removing namespaces and removing resulting duplicates.
export const removeNamespacesAndDuplicatesFromCompletions = (items: CompletionItem[] | undefined) =>
  // Remove namespaces if `ask/show Full ACDL Namespace` is set by the user.
  items?.reduce((acc, item) => {
    const strippedLabel = stripNamespace(item.label);

    // Remove duplicates that occur from removing namespace.
    const isDuplicate = acc.some((obj) => obj.label === strippedLabel && obj.kind === item.kind);
    if (!isDuplicate) {
      acc.push({...item, label: strippedLabel ?? ""});
    }
    return acc;
  }, [] as CompletionItem[]);

export interface APLAContent {
  text: string;
  when?: string;
}

/**
 * Extract all string content properties under apla template object
 * @param {object} apla apla template
 * @returns all string content properties as APLAContent[]
 * Note: "${" is replaced by "{" and "{payload." is replaced by "{" to make it look more like it is in utterances
 */
export const getAPLAContent = (apla): APLAContent[] => {
  if (!apla) {
    return [];
  }

  const queue = [apla];
  const returnValue: APLAContent[] = [];
  while (queue.length !== 0) {
    const obj = queue.shift();
    const {content} = obj;
    if (typeof content === "string") {
      const when = obj.when && typeof obj.when === "string" ? obj.when : undefined;
      const whenDisplay = (when ? `when ${when}` : "").replace(/\${/g, "{").replace(/{payload\./g, "{");
      const contentDisplay = content.replace(/\${/g, "{").replace(/{payload\./g, "{");
      returnValue.push({text: contentDisplay, when: whenDisplay});
    }

    if (Array.isArray(obj)) {
      queue.push(...obj);
    } else if (typeof obj === "object") {
      queue.push(...Object.values(obj));
    }
  }

  return returnValue;
};
