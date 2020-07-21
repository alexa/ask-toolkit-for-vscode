import * as vscode from 'vscode';
import * as mapper from 'json-source-map';
import * as R from 'ramda';
import { StaticAplTemplateValidator, IValidationInfo, NotificationLevel, ErrorController } from 'apl-suggester';
import { Map as immutableMap } from 'immutable';
import { DOCUMENT_PATH_REGEX } from '../config/configuration';

let errorList: object[] = [];

const ROOT = '/';
const POINTERS_ROOT_PROPERTY = ' ';
const VALUE_PROPERTY = 'value';
const LINE = 'line';
const COLUMN = 'column';
const KEY = 'key';
const KEY_END = 'keyEnd';
const URI = 'uri';
const FSPATH = 'fsPath';

/**
 * A Map stored errorCode and errorMessage pairs
 */
const errorCodeMap = immutableMap([
    ['-1050', placeholder => `the inputted APL template cannot be null or empty.`],
    ['-1150', placeholder => `unable to find layout: ${placeholder.name}.`],
    ['-1051', placeholder => `component cannot have both item and items.`],
    ['-1052', placeholder => `unable to find component type for item: ${placeholder.item}.`],
    ['-1100', placeholder => `unable to multiply dimension ${placeholder.property}: ${placeholder.value}.`],
    ['-1151', placeholder => `layout needs a valid name.`],
    ['-1200', placeholder => `error when trying to fetch package from ${placeholder.url}.`],
]);

/**
 * Handles errors published by the validator:
 * @param {IError} error
 */
function handleRendererErrors(error) {
    const newErrorObject = JSON.parse(JSON.stringify(error));
    errorList.push(newErrorObject);
}

/**
 * Helper function for validation all templates
 * param: template: JSON array
 * */
function subscribeToErrors() {
    const errorController = ErrorController.getInstance();
    errorController.setErrorInterface({
        sendError: handleRendererErrors,
    });
    errorController.registerErrors();
}

/**
 * A function to format the errorMessage
 */
function formatErrorMessage(placeholder, errorCode) {
    const mapErrorCodeToMessage = errorCodeMap.get(errorCode);
    return mapErrorCodeToMessage && mapErrorCodeToMessage(placeholder);
}

/**
 * A function to convert each error result: { level:, type: , code: , placeholders: { name: , path: } }
 *  to formatted error result: { level: , path: , errorMessage: }
 */
function getFormattedErrorResults(error): IValidationInfo[] {
    return error.map(eachError => {
        const errorCode = eachError.code;
        const placeholder = eachError.placeholders;
        const errorMessage = formatErrorMessage(placeholder, errorCode);
        return { level: NotificationLevel.ERROR, path: placeholder.path, errorMessage };
    });
}

function getUniqueValidationResult(validationResult: IValidationInfo[]): IValidationInfo[] {
    const pathMap: Map<string, boolean> = new Map<string, boolean>();
    return validationResult.filter(eachValidationResult => {
        const validationResultPath = eachValidationResult.path;
        if (pathMap.has(validationResultPath)) {
            return false;
        }

        pathMap.set(validationResultPath, true);
        return true;
    });
}

function getPosition(property: string, pointer: any): vscode.Position {
    const lineNumber: number = R.path([property, LINE], pointer) as number;
    const columnNumber: number = R.path([property, COLUMN], pointer) as number;
    return new vscode.Position(lineNumber, columnNumber);
}

function getRangeFromJsonSourceMapByPath(sourceMapperedJson: any, jsonPath: string): any {
    const { pointers } = sourceMapperedJson;
    try {
        // apl-suggester returns '/' as key for root level validation
        // However, json-source-map use empty string as key
        // the check is to get correct root level validation position info
        if (jsonPath === ROOT) {
            const rootPointer: any = pointers[POINTERS_ROOT_PROPERTY];
            const valuePosition: vscode.Position = getPosition(VALUE_PROPERTY, rootPointer);
            return new vscode.Range(valuePosition, valuePosition);
        }
        const pointer: any = pointers[jsonPath];
        if (Object.keys(pointer).includes(KEY)) {
            const startPosition: vscode.Position = getPosition(KEY, pointer);
            const endPosition: vscode.Position = getPosition(KEY_END, pointer);
            return new vscode.Range(startPosition, endPosition);
        }
        const valuePosition: vscode.Position = getPosition(VALUE_PROPERTY, pointer);
        return new vscode.Range(valuePosition, valuePosition);
    } catch (error) {
        // todo: debug usage, will change to other formal logging mechnichm
        console.log('My pointer is', pointers[jsonPath], '.\n The error is:', error);
        return undefined;
    }
}

export function updateDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection): void {
    const documentPath: string = R.path([URI, FSPATH], document) as string;
    if (!documentPath) {
        return;
    }
    if (DOCUMENT_PATH_REGEX.test(documentPath)) {
        errorList = [];
        subscribeToErrors();
        const validator = new StaticAplTemplateValidator();
        const aplTemplate: object = JSON.parse(document.getText());
        validator.validate(aplTemplate).then(validationResult => {
            const sourceMapperedJson: any = mapper.parse(document.getText());
            const errorResults = getFormattedErrorResults(errorList);
            const diagnostics: any = getUniqueValidationResult(validationResult)
                .concat(errorResults)
                .map((eachValidationResult: IValidationInfo) => {
                    const severity: vscode.DiagnosticSeverity =
                        eachValidationResult.level === NotificationLevel.ERROR
                            ? vscode.DiagnosticSeverity.Error
                            : vscode.DiagnosticSeverity.Warning;
                    const range: any = getRangeFromJsonSourceMapByPath(sourceMapperedJson, eachValidationResult.path);

                    return {
                        code: '',
                        message: eachValidationResult.errorMessage,
                        range,
                        severity,
                        source: '',
                    };
                })
                .filter(eachFilteredResult => eachFilteredResult.range !== undefined);
            collection.set(document.uri, diagnostics);
        });
    } else {
        collection.clear();
    }
}

export function addAplDiagnostics(context: vscode.ExtensionContext): void {
    const collection = vscode.languages.createDiagnosticCollection('apl validation');
    if (vscode.window.activeTextEditor) {
        updateDiagnostics(vscode.window.activeTextEditor.document, collection);
    }
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                updateDiagnostics(editor.document, collection);
            }
        })
    );
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            if (event) {
                updateDiagnostics(event.document, collection);
            }
        })
    );
}
