import * as vscode from 'vscode';

/**
 * Interface of APL resource
 * 
 * @export
 * @interface AplResource
 */
export interface AplResource {
    sources?: string;
    document: string;
    datasources?: string;
}

/**
 * Interface of APL Sample Template QuickPickItem
 * 
 * @export
 * @interface SampleTemplateQuickPickItem
 */
export interface SampleTemplateQuickPickItem extends vscode.QuickPickItem {
    id: string;
}