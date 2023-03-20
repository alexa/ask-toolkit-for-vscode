import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  TextDocumentChangeEvent,
  CompletionItem,
  CompletionParams,
  DefinitionParams,
  TypeDefinitionParams,
  HoverParams,
  MarkupContent,
} from "vscode-languageserver/node";
import {TextDocument} from "vscode-languageserver-textdocument";

import debounce from "lodash.debounce";

import {initialize, validate, updateProject, getCompletion, getDefinition, getHoverContent, getTypeDefinition, UpdateProjectResult} from "./acdlServer";
import {showFullACDLNamespaceState, removeNamespacesAndDuplicatesFromCompletions} from "./utils";
import {ACDL_LANGUAGE_SERVER, TELEMETRY_EVENTS} from "../constants";
import { ActionType } from "../runtime/lib/telemetry/constants";

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize(async (params: InitializeParams) => {
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      definitionProvider: true,
      typeDefinitionProvider: true,
      hoverProvider: true,
      completionProvider: {
        triggerCharacters: ["{", ".", "(", ",", "="],
        resolveProvider: false,
      },
    },
  };

  await initialize(params, connection);
  return result;
});

// then run validation and send diagnostics to language client
const debouncedValidation = debounce(async (change: TextDocumentChangeEvent<TextDocument>) => {
  // Start the status bar indicator and mark the start of the telemetry event
  connection.sendNotification(ACDL_LANGUAGE_SERVER.SHOW_VALIDATION_STATUS_NOTIFICATION);
  const actionId = await connection.sendRequest(ACDL_LANGUAGE_SERVER.START_TELEMETRY_ACTION, {
    actionName: TELEMETRY_EVENTS.ACDL_RUN_VALIDATIONS_EVENT,
    actionType: ActionType.ACDL_SERVER,
  });

  // Run the validations
  const error = await validate(change.document);

  // Stop the status bar indicator and stop+store the telemetry event
  connection.sendNotification(ACDL_LANGUAGE_SERVER.HIDE_VALIDATION_STATUS_NOTIFICATION);
  connection.sendNotification(ACDL_LANGUAGE_SERVER.STORE_TELEMETRY_ACTION, {actionId, errorMsg: error?.message});
}, 500);

/**
 * Per description in from the source:
 * "An event that fires when a text document managed by this manager
 * has been opened or the content changes."
 */
documents.onDidChangeContent(async (change) => {
  // Declared outside try so we can send potential errors in catch 
  let actionId;

  try {
    // update the project cache first
    const result : UpdateProjectResult = await updateProject(change.document); 
    actionId = (result === UpdateProjectResult.ADDED) ? 
      await connection.sendRequest(ACDL_LANGUAGE_SERVER.START_TELEMETRY_ACTION, {
        actionName: TELEMETRY_EVENTS.ACDL_PROJECT_LOADED_EVENT,
        actionType: ActionType.ACDL_SERVER,
      }) : undefined;

    debouncedValidation(change);

    if(actionId){
      connection.sendNotification(ACDL_LANGUAGE_SERVER.STORE_TELEMETRY_ACTION, {actionId});
    }
  } catch (error: any) {
    if(actionId){
      connection.sendNotification(ACDL_LANGUAGE_SERVER.STORE_TELEMETRY_ACTION, {actionId, errorMsg: error.message});
    }
    connection.console.log(`Error updating project: ${error.message}`);
    connection.sendNotification(ACDL_LANGUAGE_SERVER.HIDE_VALIDATION_STATUS_NOTIFICATION);
  }
});

// "Go to Definition" for a expression
connection.onDefinition(async (definitionParams: DefinitionParams) => {
  const actionId = await connection.sendRequest(ACDL_LANGUAGE_SERVER.START_TELEMETRY_ACTION, {
    actionName: TELEMETRY_EVENTS.ACDL_GET_DEFINITION_EVENT,
    actionType: ActionType.ACDL_SERVER,
  });

  try {
    const location = await getDefinition(definitionParams);
    connection.sendNotification(ACDL_LANGUAGE_SERVER.STORE_TELEMETRY_ACTION, {actionId});
    return location;
  } catch (error: any) {
    connection.sendNotification(ACDL_LANGUAGE_SERVER.STORE_TELEMETRY_ACTION, {actionId, errorMsg: error.message});
    connection.console.log(`Error fetching definition: ${error.message}`);
    return undefined;
  }
});

connection.onTypeDefinition(async (typeDefinitionParams: TypeDefinitionParams) => {
  const actionId = await connection.sendRequest(ACDL_LANGUAGE_SERVER.START_TELEMETRY_ACTION, {
    actionName: TELEMETRY_EVENTS.ACDL_GET_TYPE_DEFINITION_EVENT,
    actionType: ActionType.ACDL_SERVER,
  });

  try {
    const location = await getTypeDefinition(typeDefinitionParams);
    connection.sendNotification(ACDL_LANGUAGE_SERVER.STORE_TELEMETRY_ACTION, {actionId});
    return location;
  } catch (error: any) {
    connection.sendNotification(ACDL_LANGUAGE_SERVER.STORE_TELEMETRY_ACTION, {actionId, errorMsg: error.message});
    connection.console.log(`Error fetching type definition: ${error.message}`);
    return undefined;
  }
});

connection.onHover(async (hoverParams: HoverParams) => {
  const actionId = await connection.sendRequest(ACDL_LANGUAGE_SERVER.START_TELEMETRY_ACTION, {
    actionName: TELEMETRY_EVENTS.ACDL_GET_HOVER_EVENT,
    actionType: ActionType.ACDL_SERVER,
  });

  try {
    const hover = await getHoverContent(hoverParams);
    const hoverContents : MarkupContent = hover?.contents as MarkupContent;
    connection.sendNotification(ACDL_LANGUAGE_SERVER.STORE_TELEMETRY_ACTION, {
      actionId,
      shouldStore: (hoverContents.value !== '')
    });
    return hover;
  } catch (error: any) {
    connection.sendNotification(ACDL_LANGUAGE_SERVER.STORE_TELEMETRY_ACTION, {actionId, errorMsg: error.message});
    connection.console.log(`Error fetching hover content: ${error.message}`);
    return undefined;
  }
});

// Get auto completion
connection.onCompletion(async (completionParams: CompletionParams): Promise<CompletionItem[] | undefined> => {
  try {
    const result = await getCompletion(completionParams);
    return removeNamespacesAndDuplicatesFromCompletions(result);
  } catch (error: any) {
    const actionId = await connection.sendRequest(ACDL_LANGUAGE_SERVER.START_TELEMETRY_ACTION, {
      actionName: TELEMETRY_EVENTS.ACDL_GET_COMPLETIONS_EVENT,
      actionType: ActionType.ACDL_SERVER,
    });
    connection.sendNotification(ACDL_LANGUAGE_SERVER.STORE_TELEMETRY_ACTION, {actionId, errorMsg: error.message});
    connection.console.log(`Error fetching completions: ${error.message}`);
    return [];
  }
});

connection.onRequest(ACDL_LANGUAGE_SERVER.SHOW_FULL_NAMESPACE_REQUEST, (shouldShow) => {
  showFullACDLNamespaceState.showFullNamespace = shouldShow;
});

/** More hooks as needed ... * */

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// Listen on the connection
connection.listen();
