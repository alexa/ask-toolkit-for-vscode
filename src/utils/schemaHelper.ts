import * as fs from "fs";
import * as path from "path";
import * as https from "https";

import { Logger } from "../logger";
import { SYSTEM_ASK_FOLDER, DEFAULT_PROFILE, SCHEMA } from "../constants";
import { SmapiClientFactory, Utils } from "../runtime";
import { ext } from "../extensionGlobals";
import { loggableAskError } from "../exceptions";
import { findSkillFoldersInWs } from "../utils/workspaceHelper";
import { SkillPackageWatcher } from "../askContainer/fileSystem/skillPackageWatcher";
import { v1 } from "ask-smapi-model";

export type SkillPackageSchema = {
    pathElement: string;
    children: SkillPackageSchema[];
};

export class SchemaManager {
    private static instance: SchemaManager;

    public static getInstance(): SchemaManager {
        if (SchemaManager.instance === undefined) {
            SchemaManager.instance = new SchemaManager();
        }

        return SchemaManager.instance;
    }

    /**
     * Update all vendor specific schemas
     */
    public async updateSchemas(): Promise<void> {
        const skillFolders = await findSkillFoldersInWs();
        // Only update schema when only one skill is opened under workspace
        if (skillFolders.length === 1) {
            const skillPath = skillFolders[0].fsPath;
            const schemaFolderPath = path.join(
                skillPath,
                SYSTEM_ASK_FOLDER.HIDDEN_ASK_FOLDER,
                SYSTEM_ASK_FOLDER.SCHEMA_FOLDER.NAME
            );
            if (!fs.existsSync(schemaFolderPath)) {
                fs.mkdirSync(schemaFolderPath);
            }

            await this.updateSkillPackageSchema(schemaFolderPath);
            this.registerSkillPackageWatcher(skillPath);

            // TODO: update other schema once available
        } else {
            Logger.info("Vendor specific schemas are not updated.");
        }
    }

    /**
     * update the schema for skill package structure
     * @param schemaFolderPath the path to store the schema
     */
    private async updateSkillPackageSchema(schemaFolderPath: string): Promise<void> {
        const skillPackageSchemaPath = path.join(schemaFolderPath, SYSTEM_ASK_FOLDER.SCHEMA_FOLDER.SKILL_PACKAGE);
        // TODO: add logic to skip schema downloading when not necessary
        const schemaLocationUrl = await this.getSchemaLocationUrl(SCHEMA.SKILL_PACKAGE);
        const writeStream = fs.createWriteStream(skillPackageSchemaPath);
        return new Promise((resolve, reject) => {
            const request = https.get(schemaLocationUrl, resp => {
                const stream = resp.pipe(writeStream);
                stream.on("close", () => {
                    Logger.info("skill package schema has been updated.");
                    resolve();
                });
            });
            request.on("error", err => {
                Logger.info("Download skill package schema failed");
                reject(loggableAskError("Download skill package schema failed", err, true));
            });
            request.end();
        });
    }

    /**
     * register the skill package watcher
     * @param skillPath the path of opened skill
     */
    private registerSkillPackageWatcher(skillPath: string): void {
        // If skillPackageWatcher already exist, dispose it first
        if (ext.skillPackageWatcher !== undefined) {
            ext.skillPackageWatcher.dispose();
            Logger.info('SkillPackageWatcher is disposed');
        }
        ext.skillPackageWatcher = new SkillPackageWatcher(skillPath);
        Logger.info('SkillPackageWatcher is started');
    }

    /**
     * Using smapi getResourceSchema api to retrieve schema location Url
     */
    private async getSchemaLocationUrl(resource: string, operation?: string): Promise<string> {
        let profile = Utils.getCachedProfile(ext.context);
        profile = profile ?? DEFAULT_PROFILE;
        let vendorId: string;
        let getResourceSchemaResponse: v1.skill.resourceSchema.GetResourceSchemaResponse;
        try {
            vendorId = Utils.resolveVendorId(profile);
        } catch (err) {
            throw loggableAskError(`Failed to retrieve vendorID for profile ${profile}`, err, true);
        }
        const smapiClient = SmapiClientFactory.getInstance(profile, ext.context);
        try {
            getResourceSchemaResponse = await smapiClient.getResourceSchemaV1(resource, vendorId, operation);
        } catch (err) {
            throw loggableAskError(`Failed to get skill-package schema for vendorId ${vendorId}`, err, true);
        }

        const schemaLocationUrl = getResourceSchemaResponse.schemaLocationUrl;
        if (schemaLocationUrl === undefined) {
            throw loggableAskError(`Failed to retrieve ${resource} schema location url`);
        }

        return schemaLocationUrl;
    }

    private constructor() {}
}
