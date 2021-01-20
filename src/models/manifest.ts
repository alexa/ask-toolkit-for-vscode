import * as fs from 'fs-extra';
import * as path from 'path';
import { AbstractResourcesConfig } from './resourcesConfig/abstractResourcesConfig';
import { MANIFEST_JSON, SKILL_FOLDER } from '../constants';
import { AskError } from '../exceptions';

/**
 * A utility class to create, get and set data in skill.json file
 */
export class Manifest extends AbstractResourcesConfig {
    /**
     * The constructor for Manifest class
     * @param skillFolderPath
     * @param skillPackageName
     * @param content the given content to initialize or overwrite the file
     */
    constructor(skillFolderPath: string, skillPackageName: string, content?: any) {
        const filePath = path.join(skillFolderPath, skillPackageName, SKILL_FOLDER.SKILL_PACKAGE.MANIFEST);
        if (!fs.existsSync(filePath)) {
            if (content === undefined) {
                throw new AskError('Manifest content is required when the skill.json file does not exist.');
            }
            fs.ensureDirSync(path.dirname(filePath));
        }

        super(filePath, content);
    }

    getSkillName(locale: string): string {
        return this.getProperty([
            MANIFEST_JSON.NAME,
            MANIFEST_JSON.PUBLISHING_INFORMATION.NAME,
            MANIFEST_JSON.PUBLISHING_INFORMATION.LOCALES.NAME,
            locale,
            MANIFEST_JSON.PUBLISHING_INFORMATION.LOCALES.SKILL_NAME,
        ]);
    }

    setSkillName(skillName: string, locale: string): void {
        this.setProperty(
            [
                MANIFEST_JSON.NAME,
                MANIFEST_JSON.PUBLISHING_INFORMATION.NAME,
                MANIFEST_JSON.PUBLISHING_INFORMATION.LOCALES.NAME,
                locale,
                MANIFEST_JSON.PUBLISHING_INFORMATION.LOCALES.SKILL_NAME,
            ],
            skillName
        );
    }

    getPublishingLocales() {
        return this.getProperty([
            MANIFEST_JSON.NAME,
            MANIFEST_JSON.PUBLISHING_INFORMATION.NAME,
            MANIFEST_JSON.PUBLISHING_INFORMATION.LOCALES.NAME,
        ]);
    }

    setPublishingLocales(localesObject: any) {
        return this.setProperty(
            [
                MANIFEST_JSON.NAME,
                MANIFEST_JSON.PUBLISHING_INFORMATION.NAME,
                MANIFEST_JSON.PUBLISHING_INFORMATION.LOCALES.NAME,
            ],
            localesObject
        );
    }

    getPublishingLocale(local: string) {
        return this.getProperty([
            MANIFEST_JSON.NAME,
            MANIFEST_JSON.PUBLISHING_INFORMATION.NAME,
            MANIFEST_JSON.PUBLISHING_INFORMATION.LOCALES.NAME,
            local,
        ]);
    }

    setPublishingLocale(local: string, localesObject: any) {
        return this.setProperty(
            [
                MANIFEST_JSON.NAME,
                MANIFEST_JSON.PUBLISHING_INFORMATION.NAME,
                MANIFEST_JSON.PUBLISHING_INFORMATION.LOCALES.NAME,
                local,
            ],
            localesObject
        );
    }

    getAPIsCustom() {
        return this.getProperty([MANIFEST_JSON.NAME, MANIFEST_JSON.APIS.NAME, MANIFEST_JSON.APIS.CUSTOM.NAME]);
    }

    setAPIsCustom(customObject: any) {
        return this.setProperty(
            [MANIFEST_JSON.NAME, MANIFEST_JSON.APIS.NAME, MANIFEST_JSON.APIS.CUSTOM.NAME],
            customObject
        );
    }
}
