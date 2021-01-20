import * as fs from 'fs-extra';
import * as path from 'path';

import { ASK_STATES_JSON, BASE_STATES_CONFIG, SKILL_FOLDER } from '../../constants';
import { AbstractResourcesConfig } from './abstractResourcesConfig';

/**
 * A utility class to create, get and set data in ask-states.json file
 */
export class AskStates extends AbstractResourcesConfig {
    /**
     * The constructor for AskStates class
     * @param skillFolderPath
     * @param content the given content to initialize or overwrite the file
     */
    constructor(skillFolderPath: string, content?: any) {
        const filePath = path.join(
            skillFolderPath,
            SKILL_FOLDER.HIDDEN_ASK_FOLDER,
            SKILL_FOLDER.ASK_STATES_JSON_CONFIG
        );
        if (!fs.existsSync(filePath)) {
            if (content === undefined) {
                content = BASE_STATES_CONFIG;
            }
        }
        fs.ensureDirSync(path.dirname(filePath));
        super(filePath, content);
    }

    // getter and setter

    getSkillId(profile: string): string {
        return this.getProperty([ASK_STATES_JSON.PROFILES, profile, ASK_STATES_JSON.SKILL_ID]);
    }

    setSkillId(profile: string, skillId: string): void {
        this.setProperty([ASK_STATES_JSON.PROFILES, profile, ASK_STATES_JSON.SKILL_ID], skillId);
    }

    getSkillMetaLastDeployHash(profile: string): string {
        return this.getProperty([
            ASK_STATES_JSON.PROFILES,
            profile,
            ASK_STATES_JSON.SKILL_METADATA.NAME,
            ASK_STATES_JSON.SKILL_METADATA.LAST_DEPLOY_HASH,
        ]);
    }

    setSkillMetaLastDeployHash(profile: string, lastDeployHash: string): void {
        this.setProperty(
            [
                ASK_STATES_JSON.PROFILES,
                profile,
                ASK_STATES_JSON.SKILL_METADATA.NAME,
                ASK_STATES_JSON.SKILL_METADATA.LAST_DEPLOY_HASH,
            ],
            lastDeployHash
        );
    }

    getSkillMetaETag(profile: string): string {
        return this.getProperty([
            ASK_STATES_JSON.PROFILES,
            profile,
            ASK_STATES_JSON.SKILL_METADATA.NAME,
            ASK_STATES_JSON.SKILL_METADATA.ETAG,
        ]);
    }

    setSkillMetaETag(profile: string, eTag: string): void {
        this.setProperty(
            [
                ASK_STATES_JSON.PROFILES,
                profile,
                ASK_STATES_JSON.SKILL_METADATA.NAME,
                ASK_STATES_JSON.SKILL_METADATA.ETAG,
            ],
            eTag
        );
    }
    
}
