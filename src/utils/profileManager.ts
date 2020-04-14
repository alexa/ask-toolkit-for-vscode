'use strict';
import * as vscode from 'vscode';
import { CommandRunner, ICommand } from './commandRunner';
import { ERROR_AND_WARNING, EXTERNAL_LINKS } from './configuration';
import open = require('open');
const execa = require('execa');

const NULL_AWS_PROFILE = '** NULL **';
const ENVIRONMENT_VARIABLE_USED_FOR_AWS = '__AWS_CREDENTIALS_IN_ENVIRONMENT_VARIABLE__';

export class ProfileManager {
    private static cachedProfileList: IProfile[] = [];

    /**
     * Initialize the profile manager. The profile manager will cache the profile list
     * if they exist, or show an error message with an option to initialize the ASK CLI v1
     */
    public static init() {
        try {
            const listProfileOutput = execa.shellSync('ask configure -l');
            if ((listProfileOutput.stderr && listProfileOutput.stderr.includes(ERROR_AND_WARNING.EMPTY_PROFILE_MESSAGE)) || listProfileOutput.stdout.trim().length === 0) {
                return;
            }
            const profileOutputStrings = listProfileOutput.stdout.split('\n');
            const profileTree = profileOutputStrings.filter(this.takeOutHeaderAndEnding).map(this.extractProfilesFromCliOutput);
            if (!profileTree || profileTree.length === 0) {
                return;
            } else {
                this.cachedProfileList = profileTree;
            }
            if (!this.isAnyAwsConfiguredInProfiles()) {
                this.showAwsCredentialsMissingNotice();
            }
        } catch (error) {
            throw new Error('ASK CLI v1 is not functional. ' + error.message);
        }
    }

    /**
     * parse the profile from CLI to a list of profile object that can be stored.
     * @param profileString the output string from ASK CLI v1. i.e., [askProfile]   "awsProfile".
     */
    private static extractProfilesFromCliOutput(profileString:string) {
        const profiles = profileString.split(/\]/);
        const askProfile = profiles[0].split(/\[/)[1];
        const result = <IProfile> {
            askProfile: askProfile,
            awsProfile: null
        };
        const restProfileString = profiles[1];
        if (restProfileString.includes(NULL_AWS_PROFILE)) {
            result.awsProfile = null;
        } else if (restProfileString.includes(ENVIRONMENT_VARIABLE_USED_FOR_AWS)) {
            result.awsProfile = 'ENVIRONMENT VARIABLE';
        } else {
            const awsProfile = restProfileString.trim().replace(/\"/g, '');
            result.awsProfile = awsProfile;
        }
        return result;
    }

    /**
     * Remove the first line (header) and last line (empty spaces) from the ASK CLI v1 output list.
     * @param input entire output from ASK CLI v1
     */
    private static takeOutHeaderAndEnding(input: string) {
        if (input.length === 0 || input.includes('Associated AWS Profile')) {
            return false;
        } 
        return true;
    }

    /**
     * show no profile exists message and a button that can trigger the 'ask init' process
     */
    public static async showProfileMissingAndSetupNotice() {
        const action = await vscode.window.showErrorMessage(ERROR_AND_WARNING.SUGGEST_INIT_CLI, ERROR_AND_WARNING.INIT_CLI_ACTION);
        if (action === ERROR_AND_WARNING.INIT_CLI_ACTION) {
            CommandRunner.runCommand( <ICommand>{
                command: 'init'
            });
            open(EXTERNAL_LINKS.INIT_COMMAND_DOC);
        }
    }

    /**
     * check whether aws is configured in at least one of the cached profiles
     */
    public static isAnyAwsConfiguredInProfiles() {
        for (let entry of this.cachedProfileList) {
            if (entry.awsProfile !== null) {
                return true;
            }
        }
        return false;
    }

    /**
     * show no aws credentials set up in any profiles message and a button to open documentation
     */
    public static async showAwsCredentialsMissingNotice() {
        const action = await vscode.window.showWarningMessage(ERROR_AND_WARNING.CHECK_AWS_PROFILE_EXISTS.MISSING_AWS_PROFILE, ERROR_AND_WARNING.CHECK_AWS_PROFILE_EXISTS.BUTTON_MESSAGE);
        if (action === ERROR_AND_WARNING.CHECK_AWS_PROFILE_EXISTS.BUTTON_MESSAGE) {
            open(EXTERNAL_LINKS.INIT_COMMAND_DOC);
        }
    }


    public static async getProfileList() {
        if (this.cachedProfileList.length === 0) {
            this.init();
        }
        // pass a new copy of the list
        return this.cachedProfileList.slice(0);
    }

    /**
     * clear the profile cache
     */
    public static clearCachedProfile() {
        this.cachedProfileList = [];
    }
}

export interface IProfile {
    askProfile: string;
    awsProfile: string | null;
}
