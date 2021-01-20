/*
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import AdmZip = require('adm-zip');
import { DISPLAY_DIR_ROOT_PATH_RELATIVE_TO_SKILL_PACAKGE } from '../config/configuration';
import { getSkillMetadataSrc } from '../../utils/skillHelper';

/**
 * Helper function to make directory with a directory name
 * create directory if doesn't exist
 *
 * @export
 * @param {string} dirname - directory name
 * @returns {void}
 */
export function makeDirSync(dirname: string): void {
    if (fs.existsSync(dirname)) { return; }
    if (!fs.existsSync(path.dirname(dirname))) {
        makeDirSync(path.dirname(dirname));
    }
    fs.mkdirSync(dirname);
}

/**
 * Helper function to make a file and write content to it
 *
 * @export
 * @param {string} filePath - path of the file
 * @param {object} fileContent - content of the file
 */
export function makeFileSync(filePath: string, fileContent: object): void {
    makeDirSync(path.dirname(filePath));
    fs.writeFileSync(filePath, JSON.stringify(fileContent, null, 4));
}

/**
 * Helper function to update content in a file
 * @export
 * @param path - given file path
 * @param content - content to update
 */
export async function updateFileContent(path: string, content: string): Promise<void> {
    const scheme: string = fs.existsSync(path) ? "file:" : "untitled:";
    const textDoc = await vscode.workspace.openTextDocument(vscode.Uri.parse(scheme + path));
    const editor = await vscode.window.showTextDocument(textDoc);
    editor.edit(edit => {
        const firstLine = editor.document.lineAt(0);
        const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
        edit.delete(new vscode.Range(firstLine.range.start, lastLine.range.end));
        edit.insert(new vscode.Position(0, 0), content);
    });
}

/**
 * Helper function to read file content as string from a zip package
 * 
 * @export
 * @param {AdmZip} zip - zip package to read from
 * @param {string} filePathInZip - file path in zip package
 * @returns {string} 
 */
export function readFileContentFromZip(zip: AdmZip, filePathInZip: string): string | null {
    const content: Buffer | null = zip.readFile(filePathInZip);
    return content !== null ? content.toString() : null;
}

/**
 * The root path for visual assets in skill package
 * @param folderPath 
 * @param profile 
 */
export function displayDirRootPath(folderPath, profile) {
    const { skillPackageSrc } = getSkillMetadataSrc(folderPath, profile)
    return path.join(skillPackageSrc, DISPLAY_DIR_ROOT_PATH_RELATIVE_TO_SKILL_PACAKGE);
}