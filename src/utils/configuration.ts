'use strict';
export const EXTERNAL_LINKS = {
    DEV_PORTAL: 'https://developer.amazon.com/alexa/console/ask',
    HELP_DOC: 'https://developer.amazon.com/docs/ask-toolkit/get-started-with-the-ask-toolkit-for-visual-studio-code.html',
    ASK_CLI_INSTALL_DOC: 'https://developer.amazon.com/docs/smapi/quick-start-alexa-skills-kit-command-line-interface.html',
    CONTACT_US: 'https://developer.amazon.com/support/contact-us?subjectCategory=ALEXA',
    DEVELOPER_FORUMS: 'https://forums.developer.amazon.com/spaces/165/index.html',
    FEATURE_REQUEST: 'https://alexa.uservoice.com/',
    REPORT_ISSUE : 'https://github.com/alexa-labs/ask-toolkit-for-vscode/issues',
    INIT_COMMAND_DOC : 'https://developer.amazon.com/docs/smapi/ask-cli-command-reference.html#init-command'
};

export const EXTENSION_CONFIG = {
    INTEGRATED_TERMINAL_NAME: 'Alexa',
    VALID_RESOURCES: ['all', 'skill', 'model', 'lambda', 'isp'],
    DEFAULT_PREFIX: 'ask'
};

export const OPERATION = {
    HIGH_LEVEL : {
        DEPLOY: {
            COMMAND: 'deploy',
            EXTENSION_REGISTERED_NAME: 'deploy'
        },
        DEPLOY_SKILL_MANIFEST_ONLY: {
            EXTENSION_REGISTERED_NAME: 'deploySkillManifestOnly'
        },
        DEPLOY_ISP_ONLY: {
            EXTENSION_REGISTERED_NAME: 'deployIspOnly'
        },
        DEPLOY_MODELS_ONLY: {
            EXTENSION_REGISTERED_NAME: 'deployModelsOnly'
        },
        DPELOY_LAMBDA_ONLY: {
            EXTENSION_REGISTERED_NAME: 'deployLambdaOnly'
        },
        CLONE: {
            COMMAND: 'clone',
            EXTENSION_REGISTERED_NAME: 'clone'
        },
        DIFF: {
            COMMAND: 'diff',
            EXTENSION_REGISTERED_NAME: 'diff'
        },
        SIMULATE: {
            COMMAND: 'simulate',
            EXTENSION_REGISTERED_NAME: 'simulate'
        },
        INIT: {
            COMMAND: 'init',
            EXTENSION_REGISTERED_NAME: 'init'
        },
        NEW_TEMPLATE: {
            COMMAND: 'new',
            EXTENSION_REGISTERED_NAME: 'new'
        },
        INITIALIZATION: {
            COMMAND: 'init',
            EXTENSION_REGISTERED_NAME: 'init'
        },
        DIALOG: {
            COMMAND: 'dialog',
            EXTENSION_REGISTERED_NAME: 'dialog'
        },
        CONFIGURE: {
            COMMAND: 'configure',
            EXTENSION_REGISTERED_NAME: 'configure'
        }
    },
    LOW_LEVEL: {
        LAMBDA_LOG: {
            COMMAND: 'lambda',
            SUB_COMMAND: 'log',
            TITLE: 'AWS Lambda - Get AWS Lambda logs from Amazon CloudWatch'
        },
        ENABLE_SKILL: {
            COMMAND: 'api',
            SUB_COMMAND: 'enable-skill',
            TITLE: 'Skill - Enable a skill'
        },
        GET_MODEL: {
            COMMAND: 'api',
            SUB_COMMAND: 'get-model',
            TITLE: 'Model - Get an interaction model for skill'
        },
        HEAD_MODEL: {
            COMMAND: 'api',
            SUB_COMMAND: 'head-model',
            TITLE:  'Model - Get the ETag associated with an interaction model'
        },
        UPDATE_MODEL: {
            COMMAND: 'api',
            SUB_COMMAND: 'update-model',
            TITLE: 'Model - Create/update the new interaction model for skill'
        },
        CREATE_SKILL: {
            COMMAND: 'api',
            SUB_COMMAND: 'create-skill',
            TITLE: 'Skill - Create a skill based on the skill manifest'
        },
        GET_SKILL: {
            COMMAND: 'api',
            SUB_COMMAND: 'get-skill',
            TITLE: 'Skill - Get the skill manifest'
        },
        UPDATE_SKILL: {
            COMMAND: 'api',
            SUB_COMMAND: 'update-skill',
            TITLE: 'Skill - Update the skill manifest'
        },
        LIST_SKILLS: {
            COMMAND: 'api',
            SUB_COMMAND: 'list-skills',
            TITLE: 'Skill - List skills based on Vendor ID and chosen profile'
        },
        GET_SKILL_STATUS: {
            COMMAND: 'api',
            SUB_COMMAND: 'get-skill-status',
            TITLE: 'Skill - Get the skill status'
        },
        GET_ACCOUNT_LINKING: {
            COMMAND: 'api',
            SUB_COMMAND: 'get-account-linking',
            TITLE: 'Skill - Get account linking configuration for a skill'
        },
        DELETE_ACCOUNT_LINKING: {
            COMMAND: 'api',
            SUB_COMMAND: 'delete-account-linking',
            TITLE: 'Skill - Delete account linking configuration for a skill'
        },
        DELETE_SKILL: {
            COMMAND: 'api',
            SUB_COMMAND: 'delete-skill',
            TITLE: 'Skill - Delete a skill'
        },
        LIST_VENDORS: {
            COMMAND: 'api',
            SUB_COMMAND: 'list-vendors',
            TITLE: 'Skill - List the Vendor ID associated with your developer account'
        },
        SUBMIT: {
            COMMAND: 'api',
            SUB_COMMAND: 'submit',
            TITLE: 'Skill - Submit a skill for certification'
        },
        WITHDRAW: {
            COMMAND: 'api',
            SUB_COMMAND: 'withdraw',
            TITLE: 'Skill - Withdraw a skill from the certification process'
        },
        SIMULATE_SKILL: {
            COMMAND: 'api',
            SUB_COMMAND: 'simulate-skill',
            TITLE: 'Simulate - Simulate a skill'
        },
        GET_SIMULATION: {
            COMMAND: 'api',
            SUB_COMMAND: 'get-simulation',
            TITLE: 'Simulate - Get the simulate result'
        },
        INVOKE_SKILL: {
            COMMAND: 'api',
            SUB_COMMAND: 'invoke-skill',
            TITLE: 'Simulate - Invoke a skill'
        },
        VALIDATE_SKILL: {
            COMMAND: 'api',
            SUB_COMMAND: 'validate-skill',
            TITLE: 'Skill - Validate a skill'
        },
        GET_VALIDATION: {
            COMMAND: 'api',
            SUB_COMMAND: 'get-validation',
            TITLE: 'Skill - Get the skill validation result'
        },
        ADD_PRIVATE_DISTRIBUTION_ACCOUNT: {
            COMMAND: 'api',
            SUB_COMMAND: 'add-private-distribution-account',
            TITLE: 'Skill - Grant/Add access to a private skill for the account'
        },
        DELETE_PRIVATE_DISTRIBUTION_ACCOUNT: {
            COMMAND: 'api',
            SUB_COMMAND: 'delete-private-distribution-account',
            TITLE: 'Skill - Revoke/Delete access to a private skill from the account'
        },
        LIST_PRIVATE_DISTRIBUTION_ACCOUNTS: {
            COMMAND: 'api',
            SUB_COMMAND: 'list-private-distribution-accounts',
            TITLE: 'Skill - List all accounts that the skill have been privately distributed'
        },
        DISABLE_SKILL: {
            COMMAND: 'api',
            SUB_COMMAND: 'disable-skill',
            TITLE: 'Skill - Disable a skill'
        },
        GET_SKILL_ENABLEMENT: {
            COMMAND: 'api',
            SUB_COMMAND: 'get-skill-enablement',
            TITLE: 'Skill - Get skill enablement information'
        },
        CREATE_ISP: {
            COMMAND: 'api',
            SUB_COMMAND: 'create-isp',
            TITLE: 'ISP - Create an in-skill product'
        },
        UPDATE_ISP: {
            COMMAND: 'api',
            SUB_COMMAND: 'update-isp',
            TITLE: 'ISP - Update an in-skill product'
        },
        ASSOCIATE_ISP: {
            COMMAND: 'api',
            SUB_COMMAND: 'associate-isp',
            TITLE: 'ISP - Associate an in-skill product with a skill'
        },
        DISASSOCIATE_ISP: {
            COMMAND: 'api',
            SUB_COMMAND: 'disassociate-isp',
            TITLE: 'ISP - Disassociate an in-skill product from a skill'
        },
        GET_ISP: {
            COMMAND: 'api',
            SUB_COMMAND: 'get-isp',
            TITLE: 'ISP - Get the definition or its summary for an in-skill product'
        },
        LIST_ISP_FOR_VENDOR: {
            COMMAND: 'api',
            SUB_COMMAND: 'list-isp-for-vendor',
            TITLE: 'ISP - List the in-skill product for a vendor'
        },
        LIST_ISP_FOR_SKILL: {
            COMMAND: 'api',
            SUB_COMMAND: 'list-isp-for-skill',
            TITLE: 'ISP - List the in-skill product that are associated with a skill'
        },
        LIST_SKILLS_FOR_ISP: {
            COMMAND: 'api',
            SUB_COMMAND: 'list-skills-for-isp',
            TITLE: 'ISP - List the skills that are associated with an in-skill product'
        },
        RESET_ISP_ENTITLEMENT: {
            COMMAND: 'api',
            SUB_COMMAND: 'reset-isp-entitlement',
            TITLE: 'ISP - Reset an in-skill product entitlement'
        },
        DELETE_ISP: {
            COMMAND: 'api',
            SUB_COMMAND: 'delete-isp',
            TITLE: 'ISP - Delete an in-skill product'
        },
        INTENT_REQUESTS_HISTORY: {
            COMMAND: 'api',
            SUB_COMMAND: 'intent-requests-history',
            TITLE: 'Skill - Get "utterance transcripts"/"intent requests history" for a skill'
        },
        CREATE_ACCOUNT_LINKING: {
            COMMAND: 'api',
            SUB_COMMAND: 'create-account-linking',
            TITLE: 'Skill - Create/update account linking configuration for a skill'
        },
        LIST_CATALOGS: {
            COMMAND: 'api',
            SUB_COMMAND: 'list-catalogs',
            TITLE: 'Catalog - Get the list of catalogs by the profile vendor'
        },
        GET_CATALOG: {
            COMMAND: 'api',
            SUB_COMMAND: 'get-catalog',
            TITLE: 'Catalog - Get the catalog by catalog-id'
        },
        CREATE_CATALOG: {
            COMMAND: 'api',
            SUB_COMMAND: 'create-catalog',
            TITLE: 'Catalog - Create a catalog'
        },
        LIST_CATALOG_UPLOADS: {
            COMMAND: 'api',
            SUB_COMMAND: 'list-catalog-uploads',
            TITLE: 'Catalog - List all the uploads for a catalog by catalog-id'
        },
        GET_CATALOG_UPLOAD: {
            COMMAND: 'api',
            SUB_COMMAND: 'get-catalog-upload',
            TITLE: 'Catalog - Get the catalog upload by catalog-id and upload-id'
        },
        ASSOCIATE_CATALOG_WITH_SKILL: {
            COMMAND: 'api',
            SUB_COMMAND: 'associate-catalog-with-skill',
            TITLE: 'Catalog - Associate a catalog with a skill'
        },
        UPLOAD_CATALOG: {
            COMMAND: 'api',
            SUB_COMMAND: 'upload-catalog',
            TITLE: 'Catalog - Upload a file for the catalog'
        },
        GET_BETA_TEST: {
            COMMAND: 'api',
            SUB_COMMAND: 'get-beta-test',
            TITLE: 'Beta Test - Get the beta test'
        },
        CREATE_BETA_TEST: {
            COMMAND: 'api',
            SUB_COMMAND: 'create-beta-test',
            TITLE: 'Beta Test - Create a beta test'
        },
        UPDATE_BETA_TEST: {
            COMMAND: 'api',
            SUB_COMMAND: 'update-beta-test',
            TITLE: 'Beta Test - Update the beta test'
        },
        START_BETA_TEST: {
            COMMAND: 'api',
            SUB_COMMAND: 'start-beta-test',
            TITLE: 'Beta Test - Start a beta test'
        },
        END_BETA_TEST: {
            COMMAND: 'api',
            SUB_COMMAND: 'end-beta-test',
            TITLE: 'Beta Test - End a beta test'
        },
        LIST_BETA_TESTERS: {
            COMMAND: 'api',
            SUB_COMMAND: 'list-beta-testers',
            TITLE: 'Beta Test - List testers in a beta test'
        },
        ADD_BETA_TESTERS: {
            COMMAND: 'api',
            SUB_COMMAND: 'add-beta-testers',
            TITLE: 'Beta Test - Add testers to a beta test'
        },
        REMOVE_BETA_TESTERS: {
            COMMAND: 'api',
            SUB_COMMAND: 'remove-beta-testers',
            TITLE: 'Beta Test - Remove testers from a beta test'
        },
        SEND_REMINDER_TO_BETA_TESTERS: {
            COMMAND: 'api',
            SUB_COMMAND: 'send-reminder-to-beta-testers',
            TITLE: 'Beta Test - Send reminder to testers in a beta test'
        },
        REQUEST_FEEDBACK_FROM_BETA_TESTERS: {
            COMMAND: 'api',
            SUB_COMMAND: 'request-feedback-from-beta-testers',
            TITLE: 'Beta Test - Request feedback from testers in a beta test'
        },
        
    },
    EXTERNAL: {
        DEV_PORTAL: {
            EXTENSION_REGISTERED_NAME: 'openDeveloperPortal'
        },
        HELP_DOC: {
            EXTENSION_REGISTERED_NAME: 'openHelpDoc'
        },
        CONTACT_ALEXA_TEAM: {
            EXTENSION_REGISTERED_NAME: 'contactAlexaTeam'
        }
    }
};

export const COMMAND_PARAMETERS = {
    PROFILE: 'profile',
    TARGET: 'target',
    SKILL_ID: 'skill-id'
};

export const VSCODE_SETTING_CONFIGURATION = {
    PROFILE: 'profile',
    DEFAULT_DEPLOY_RESOURCE: 'defaultDeployResource',
    AUTO_DETECT_SKILL_ID: 'shouldUseSkillIdFoundInCurrentWorkspace'
};


export const ERROR_AND_WARNING = {
    EMPTY_PROFILE_MESSAGE: 'ask-cli v1 has not set up any profiles yet',
    SUGGEST_INIT_CLI: 'ASK Command Line Interface (ASK CLI v1) is not initialized with your Amazon developer account credentials.',
    INIT_CLI_ACTION: 'Initialize the ASK CLI v1.',
    MISSING_ASK_CLI: 'ASK Command Line Interface (ASK CLI v1) is not installed. The toolkit requires ASK CLI v1 version to execute the commands.\nPlease run \"npm install -g ask-cli@1\" get to the latest CLI v1 version.',
    SUGGEST_INSTALL_CLI: 'See the ASK CLI v1 installation guide.',
    QUICK_PICK_PLACE_HOLDER: 'Please choose a profile. (You can set up a default profile in user\'s setting with \'ask.profile\').',
    CHECK_WORKSPACE_EXISTS: {
        CREATE_CLONE_ERROR_MESSAGE:'No workspace detected.\nOpen a workspace folder in which you want to create or clone your skill project and then run the command again.',
        DEPLOY_AND_RELATED_ERROR_MESSAGE: 'This command requires a valid skill workspace.\nOpen the workspace folder in which you have your skill project and then run the command again.',
        BUTTON_MESSAGE:'Open Folder'
    },
    CHECK_AWS_PROFILE_EXISTS : {
        MISSING_AWS_PROFILE : 'AWS credentials (for lambda function deployment) are not configured in any profiles yet',
        BUTTON_MESSAGE: 'Open documentation'
    }
};  
