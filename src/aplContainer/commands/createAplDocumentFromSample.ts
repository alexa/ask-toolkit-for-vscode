/*
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */
import * as vscode from 'vscode';
import * as path from 'path';
import { Map } from 'immutable';
import * as fs from 'fs';
import { AbstractCommand, CommandContext, Utils } from '../../runtime';
import { getSampleTemplates, ISampleTemplate } from 'apl-suggester';
import {
    EXTENSION_COMMAND_CONFIG,
    APL_DOCUMENT_FILE_PATH,
    DATASOURCES_FILE_PATH,
    SAMPLE_TEMPLATE_ID_TO_NAME_MAP,
    RESOURCE_NAME_REGEX,
} from '../config/configuration';
import { displayDirRootPath, makeFileSync } from '../utils/fileHelper';
import { PROMPT_MESSAGES, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/messages';
import { SampleTemplateQuickPickItem } from '../models';
import { loggableAskError } from '../../exceptions';
import { AplPreviewWebView } from '../webViews/aplPreviewWebView';
import { ap } from 'ramda';
import { Logger } from '../../logger';
import { DEFAULT_PROFILE } from '../../constants'


export class CreateAplDocumentFromSampleCommand extends AbstractCommand<void> {
    private sampleTemplates: Map<string, ISampleTemplate>;
    private aplPreviewWebview: AplPreviewWebView;

    constructor(aplPreviewWebview: AplPreviewWebView) {
        super(EXTENSION_COMMAND_CONFIG.CREATE_APL_DOCUMENT_FROM_SAMPLE.NAME);
        this.sampleTemplates = Map<string, ISampleTemplate>(getSampleTemplates());
        this.aplPreviewWebview = aplPreviewWebview;
    }

    public async execute(context: CommandContext, skillFolderWs: vscode.Uri): Promise<void> {
        Logger.debug(`Calling method: ${this.commandName}`);
        const pickedSampleItem: SampleTemplateQuickPickItem | undefined = await vscode.window.showQuickPick(
            this.getSampleOptions(),
            {
                placeHolder: PROMPT_MESSAGES.CREATE_SAMPLE_TEMPLATE,
            }
        );
        if (!pickedSampleItem) {
            return;
        }

        const inputResourceDirName = await vscode.window.showInputBox({
            value: pickedSampleItem.id.toLowerCase(),
            prompt: PROMPT_MESSAGES.ENTER_NAME_FOR_TEMPLATE,
            validateInput: this.validateInput
        });

        if (!inputResourceDirName) { 
            // input focus out
            return;
        }

        const workspaceRootPath: string = skillFolderWs.fsPath;
        const profile = Utils.getCachedProfile(context.extensionContext) ?? DEFAULT_PROFILE;
        const resourceDirPath: string = path.join(workspaceRootPath, displayDirRootPath(workspaceRootPath, profile), inputResourceDirName);
        if (fs.existsSync(resourceDirPath)) {
            throw loggableAskError(ERROR_MESSAGES.CREATE_APL_FROM_SAMPLE_TEMPLATE_NAME_EXISTS, undefined, true);
        }

        this.createAplandDataFileFromSample(pickedSampleItem, resourceDirPath);

        const aplDocumentFilePath = this.constructFullFilePath(resourceDirPath, APL_DOCUMENT_FILE_PATH);
        const textDoc = await vscode.workspace.openTextDocument(vscode.Uri.parse('file:' + aplDocumentFilePath));
        await vscode.window.showTextDocument(textDoc);
        this.aplPreviewWebview.showView();
    }

    /**
     * Fucntion to validate if the input resource name is valid
     * 
     * @private
     * @param {string} value - resource name input to validate 
     * @returns {(string | undefined)} 
     * 
     * @memberOf CreateAplDocumentFromSampleCommand
     */
    private validateInput(value: string): string | undefined {
        return value && RESOURCE_NAME_REGEX.test(value) ? undefined : PROMPT_MESSAGES.TEMPLATE_NAMING_HINTS;
    }

    /**
     * Fuction to create APL document and datasources file from picked sample
     *
     * @private
     * @param {SampleTemplateQuickPickItem} pickedSampleItem - picked sample template item
     * @param {string} resourceDirPath - resource directory path
     * @returns {Promise<void>}
     *
     * @memberOf CreateAplDocumentFromSample
     */
    private async createAplandDataFileFromSample(
        pickedSampleItem: SampleTemplateQuickPickItem,
        resourceDirPath: string
    ): Promise<void> {
        const pickedSampleTemplate: ISampleTemplate | undefined = this.sampleTemplates.get(pickedSampleItem.id);
        if (!pickedSampleTemplate) {
            throw loggableAskError(ERROR_MESSAGES.CREATE_APL_FROM_SAMPLE_NO_SAMPLE_TEMPLATE_FOUND, new Error(`No sample template found for ${pickedSampleItem.label}`), true);
        }
        const aplFileContent = pickedSampleTemplate.apl;
        const dataFileContent = pickedSampleTemplate.data;

        const aplDocumentFilePath = this.constructFullFilePath(resourceDirPath, APL_DOCUMENT_FILE_PATH);
        const datasourcesFilePath = this.constructFullFilePath(resourceDirPath, DATASOURCES_FILE_PATH);

        makeFileSync(aplDocumentFilePath, aplFileContent);
        makeFileSync(datasourcesFilePath, dataFileContent);

        vscode.window.showInformationMessage(SUCCESS_MESSAGES.CREATE_APL_FROM_SAMPLE_SUCCESS);
    }

    /**
     * Function to construct full path for APL document/datasources assets
     *
     * @param resourceDirPath - directory path
     * @param relativePath - relative path to directory
     */
    private constructFullFilePath(resourceDirPath: string, relativePath: string): string {
        return path.join(resourceDirPath, relativePath);
    }

    /**
     * Function to get options for all sample templates
     *
     * @private
     * @returns {SampleTemplateQuickPickItem[]}
     *
     * @memberOf CreateAplDocumentFromSample
     */
    private getSampleOptions(): SampleTemplateQuickPickItem[] {
        return this.sampleTemplates
            .map(
                (v, k) =>
                    ({
                        label: SAMPLE_TEMPLATE_ID_TO_NAME_MAP.get(k),
                        id: k
                    } as SampleTemplateQuickPickItem)
            )
            .valueSeq()
            .toArray();
    }
}
