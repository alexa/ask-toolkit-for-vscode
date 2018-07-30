'use strict';
import * as R from 'ramda';
import * as vscode from 'vscode';
import * as jsonfile from 'jsonfile';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Find skill Id from .ask/config file if applicable.
 * @param profile
 * @return {string|undefined}
 */
export function findSkillId(profile: string): string|undefined {
    // generate the error message
    const warnMessage = (missedResource:string) => {
        vscode.window.showWarningMessage(`Cannot automatically detect the skill ID, since no ${missedResource} has been found.`);
        return undefined;
    };

    // logic
    if (!profile) {
        return warnMessage('default profile');
    }
    let workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return warnMessage('valid workspace');
    }

    const uri = workspaceFolders[0].uri.toString();
    const baseUri = /file\:\/\/(.+)$/.exec(uri)![1];
    const configPath = path.join(baseUri, '.ask', 'config');
    if (!fs.existsSync(configPath)) {
        return warnMessage('.ask/config file');
    } else {
        const config = jsonfile.readFileSync(configPath);
        const skillIdJsonPath = R.path(['deploy_settings', profile, 'skill_id']);
        const skillId = skillIdJsonPath(config);
        if (skillId) {
            return skillId.toString();
        } else {
            return warnMessage('valid "skill ID" value in .ask/confg');
        }
    }
}

export function findProfile(): string | undefined {
    return vscode.workspace.getConfiguration('ask').get('profile');
}


/**
 * Create a vscode.QuickPickItem bases on the cached profile object
 * @param profileObject internal cached profile
 */
export function turnIProfileObjectIntoQuickPickItem(profileObject:any) {
    if (!profileObject || !profileObject.askProfile) {
        return;
    }
    const res: vscode.QuickPickItem = {
        label: profileObject.askProfile
    };
    if (!profileObject.awsProfile) {
        res.detail = "Not associated with any AWS profile";
    } else {
        res.detail = `Associated AWS profile: ${profileObject.awsProfile}`;
    }
    return res;
}
