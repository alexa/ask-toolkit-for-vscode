import * as fs from 'fs-extra';
import * as path from 'path';

import { ASK_RESOURCES_JSON, BASE_RESOURCES_CONFIG, SKILL_FOLDER } from '../../constants';
import { AbstractResourcesConfig } from './abstractResourcesConfig';

/**
 * A utility class to create, get and set data in ask-resources.json file
 */
export class AskResources extends AbstractResourcesConfig {
    /**
     * The constructor for AskResources class
     * @param skillFolderPath
     * @param content the given content to initialize or overwrite the file
     */
    constructor(skillFolderPath: string, content?: any) {
        const filePath = path.join(skillFolderPath, SKILL_FOLDER.ASK_RESOURCES_JSON_CONFIG);
        if (!fs.existsSync(filePath)) {
            if (content === undefined) {
                content = BASE_RESOURCES_CONFIG;
            }
            fs.ensureDirSync(path.dirname(filePath));
        }
        super(filePath, content);
    }

    // getter and setter

    getSkillId(profile: string): string {
        return this.getProperty([ASK_RESOURCES_JSON.PROFILES, profile, ASK_RESOURCES_JSON.SKILL_ID]);
    }

    setSkillId(profile: string, skillId: string): void {
        this.setProperty([ASK_RESOURCES_JSON.PROFILES, profile, ASK_RESOURCES_JSON.SKILL_ID], skillId);
    }

    getProfile(profile: string): string {
        return this.getProperty([ASK_RESOURCES_JSON.PROFILES, profile]);
    }

    setProfile(profile: string, profileVale: string | undefined): void {
        this.setProperty([ASK_RESOURCES_JSON.PROFILES, profile], profileVale);
    }

    getSkillMetaSrc(profile: string): string {
        return this.getProperty([
            ASK_RESOURCES_JSON.PROFILES,
            profile,
            ASK_RESOURCES_JSON.SKILL_METADATA.NAME,
            ASK_RESOURCES_JSON.SKILL_METADATA.SRC,
        ]);
    }

    setSkillMetaSrc(profile: string, skillMetaSrc: string): void {
        this.setProperty(
            [
                ASK_RESOURCES_JSON.PROFILES,
                profile,
                ASK_RESOURCES_JSON.SKILL_METADATA.NAME,
                ASK_RESOURCES_JSON.SKILL_METADATA.SRC,
            ],
            skillMetaSrc
        );
    }

    getSkillInfraType(profile: string): string {
        return this.getProperty([
            ASK_RESOURCES_JSON.PROFILES,
            profile,
            ASK_RESOURCES_JSON.SKILL_INFRASTRUCTURE.NAME,
            ASK_RESOURCES_JSON.SKILL_INFRASTRUCTURE.TYPE,
        ]);
    }

    setSkillInfraType(profile: string, type: string): void {
        this.setProperty(
            [
                ASK_RESOURCES_JSON.PROFILES,
                profile,
                ASK_RESOURCES_JSON.SKILL_INFRASTRUCTURE.NAME,
                ASK_RESOURCES_JSON.SKILL_INFRASTRUCTURE.TYPE,
            ],
            type
        );
    }
}
