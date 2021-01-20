import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { SYSTEM_ASK_FOLDER, SKILL_PACKAGE_FORMAT_GUID, DEFAULT_PROFILE } from '../../constants';
import { SkillPackageSchema } from '../../utils/schemaHelper';
import { Logger } from '../../../src/logger';
import { getSkillMetadataSrc } from '../../utils/skillHelper';
import { Utils } from '../../runtime';
import { ext } from '../../extensionGlobals';

export class SkillPackageWatcher {
    public skillPath: string;
    public skillPackageSchema: SkillPackageSchema | undefined;
    public skillPackagePath: string | undefined;
    public fileSystemWatcher: vscode.FileSystemWatcher | undefined;

    constructor(skillPath: string) {
        this.skillPath = skillPath;
        this.skillPackageSchema = this.getSkillPackageSchema();
        this.skillPackagePath = this.getSkillPackagePath();
        this.fileSystemWatcher = this.startSkillPackageWatcher();
    }

    /**
     * retrieve skillPackage schema from local .ask folder
     */
    private getSkillPackageSchema(): SkillPackageSchema | undefined {
        const skillPackageSchemaPath = path.join(
            this.skillPath,
            SYSTEM_ASK_FOLDER.HIDDEN_ASK_FOLDER,
            SYSTEM_ASK_FOLDER.SCHEMA_FOLDER.NAME,
            SYSTEM_ASK_FOLDER.SCHEMA_FOLDER.SKILL_PACKAGE
        );
        let skillPackageSchema: SkillPackageSchema | undefined;
        try {
            const skillPackageStr = fs.readFileSync(skillPackageSchemaPath).toString();
            skillPackageSchema = JSON.parse(skillPackageStr);
        } catch (err) {
            const warningMessage = 
                `Failed to read skill package schema due to ${err}, the skill package watcher won't start.`;
            void vscode.window.showWarningMessage(warningMessage);
            Logger.debug(warningMessage);
        }

        return skillPackageSchema;
    }

    /**
     * retrieve the skill package path
     */
    private getSkillPackagePath(): string | undefined {
        try {
            let profile = Utils.getCachedProfile(ext.context);
            profile = profile ?? DEFAULT_PROFILE;
            const { skillPackageAbsPath } = getSkillMetadataSrc(this.skillPath, profile);
            return skillPackageAbsPath;
        } catch (err) {
            const warningMessage = 
                `Failed to read skill package path due to ${err}, the skill package watcher won't start.`;
            void vscode.window.showWarningMessage(warningMessage);
            Logger.debug(warningMessage);

            return undefined;
        }
    }

    /**
     * Create a fileSystemWatcher on the skill package folder
     * The watcher will do skill package folder structure validation whenever
     * create or delete file / folder event is fired
     */
    private startSkillPackageWatcher(): vscode.FileSystemWatcher | undefined {
        // Only start the watcher when both schema and skillPackage path is available
        if (this.skillPackageSchema === undefined || this.skillPackagePath === undefined) {
            return undefined;
        }

        const watcher = vscode.workspace.createFileSystemWatcher(`${this.skillPackagePath}/**/*`, false, true, false);

        watcher.onDidCreate(() => {
            this.validate();
        });

        watcher.onDidDelete(() => {
            this.validate();
        });

        return watcher;
    }

    /**
     * Validate the Url based on the schema
     * @param url Url need to be validated
     * @param schema SkillPackage structure schema
     * @param violations Array used to record all violations
     */
    private isValidPath(url: string, schema: SkillPackageSchema, violations: string[]): void {
        const baseName = path.basename(url);
        // Check whether the baseName match any pathElement regex
        for (const schemaChild of schema.children) {
            if (regexMatch(schemaChild.pathElement, baseName)) {
                // If the baseName match any pathElement regex, the baseName will be considered as valid.
                // Then check whether it is a folder
                if (fs.statSync(url).isDirectory()) {
                    // If it's a folder, loop all content inside it and do validations recursively
                    const children = fs.readdirSync(url);
                    for (const child of children) {
                        const childUrl = path.join(url, child);
                        this.isValidPath(childUrl, schemaChild, violations);
                    }
                }
                return;
            }
        }

        // If the baseName can't find any match, record violation in the array
        // simplify the Url by cutting redundant prefix
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const skillPackageName = path.basename(this.skillPackagePath!);
        url = url.slice(url.indexOf(skillPackageName));
        violations.push(
            `${url} is not following the correct format of skill-package structure,
            thus it won't be consumed at service side. ${SKILL_PACKAGE_FORMAT_GUID}`
        );
    }

    /**
     * check if all required files are exist in skill-package
     * @param skillPackagePath the path of skillPackage folder
     * @param violations array used to record violations
     */
    private doesRequiredFileExist(skillPackagePath: string, violations: string[]) {
        // The skill package only require skill.json so far
        const children = fs.readdirSync(skillPackagePath);
        for (const child of children) {
            if (regexMatch('skill\\.(json|JSON)', child)) {
                return;
            }
        }

        violations.push(`skill.json is missing in skill-package. ${SKILL_PACKAGE_FORMAT_GUID}`);
    }

    /**
     * validate the skillPackage structure
     */
    public validate(): void {
        // When developer change skill-package path in askResource, restart the watcher
        const latestSkillPackagePath = this.getSkillPackagePath();
        if (this.skillPackagePath !== latestSkillPackagePath) {
            this.skillPackagePath = latestSkillPackagePath;
            this.fileSystemWatcher?.dispose();
            this.fileSystemWatcher = this.startSkillPackageWatcher();
        }

        if (this.skillPackageSchema === undefined || this.skillPackagePath === undefined) {
            Logger.debug('validate function of skillPackageWatcher is not executed');
            return;
        }

        const violations: string[] = [];
        const children = fs.readdirSync(this.skillPackagePath);
        for (const child of children) {
            const childUrl = path.join(this.skillPackagePath, child);
            this.isValidPath(childUrl, this.skillPackageSchema, violations);
        }
        this.doesRequiredFileExist(this.skillPackagePath, violations);
        while (violations.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const message = violations.pop()!;
            void vscode.window.showWarningMessage(message);
            Logger.debug(message);
        }
    }

    public dispose(): void {
        if (this.fileSystemWatcher !== undefined) {
            this.fileSystemWatcher.dispose();
        }
    }
}

/**
 * Translate path element into regex and use the regex to validate the baseName
 * @param pathElement path element
 * @param baseName base name
 */
export function regexMatch(pathElement: string, baseName: string): boolean {
    const regExp = new RegExp(`^${pathElement}$`);
    return regExp.test(baseName);
}
