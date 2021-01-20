import * as path from 'path';

import { EXTENSION_TREE_VIEW_CONFIG } from "./aplContainer/config/configuration";

export const EXTENSION_DISPLAY_NAME = 'ASK Toolkit';
export const EXTENSION_PUBLISHER = 'ask-toolkit';
export const EXTENSION_FULL_NAME = 'alexa-skills-kit-toolkit';
export const EXTENSION_ID = `${EXTENSION_PUBLISHER}.${EXTENSION_FULL_NAME}`;

export const EXTERNAL_LINKS = {
    DEV_PORTAL: 'https://developer.amazon.com/alexa/console/ask',
    HELP_DOC: 'https://developer.amazon.com/docs/ask-toolkit/get-started-with-the-ask-toolkit-for-visual-studio-code.html',
    ASK_CLI_INSTALL_DOC: 'https://developer.amazon.com/docs/smapi/quick-start-alexa-skills-kit-command-line-interface.html',
    INIT_COMMAND_DOC : 'https://developer.amazon.com/docs/smapi/ask-cli-command-reference.html#init-command',
    GETTING_STARTED : 'https://developer.amazon.com/en-US/alexa/alexa-skills-kit',
    TOOLS_DOCS : {
        ASK_SDK : 'https://developer.amazon.com/en-US/docs/alexa/sdk/alexa-skills-kit-sdks.html',
        SMAPI_SDK: 'https://developer.amazon.com/en-US/docs/alexa/smapi/smapi-overview.html#smapi-sdk',
        CLI : 'https://developer.amazon.com/en-US/docs/alexa/smapi/quick-start-alexa-skills-kit-command-line-interface.html',
        VSCODE : 'https://developer.amazon.com/en-US/docs/alexa/ask-toolkit/get-started-with-the-ask-toolkit-for-visual-studio-code.html'
    },
    ALEXA_FEATURES : 'https://developer.amazon.com/en-US/docs/alexa/quick-reference/custom-skill-quick-reference.html#',
    RELEASE_UPDATES : 'https://developer.amazon.com/en-US/alexa/alexa-skills-kit/resources#whats-new-with-the-alexa-skills-kit',
    CONTACT_ALEXA_TEAM: {
        LEAVE_REVIEW: {
            TITLE: 'Leave a review',
            URL: 'https://marketplace.visualstudio.com/items?itemName=ask-toolkit.alexa-skills-kit-toolkit&ssr=false#review-details'
        },
        ASK_QUESTION: {
            TITLE: 'Ask a question',
            URL: 'https://github.com/alexa/ask-toolkit-for-vscode/issues/new?labels=guidance&template=guidance_request.md'
        },
        REPORT_ISSUE: {
            TITLE: 'Report an issue',
            URL: 'https://github.com/alexa/ask-toolkit-for-vscode/issues/new?labels=bug&template=bug_report.md'
        },
        SUBMIT_FEATURE_REQUEST: {
            TITLE: 'Submit a feature request',
            URL: 'https://github.com/alexa/ask-toolkit-for-vscode/issues/new?labels=feature-request&template=feature_request.md'
        }
    }
};

export const WEB_VIEW_NAME = {
    CREATE_SKILL: 'createSkill',
    DEPLOY_SKILL: 'deploySkill',
    INITIAL_LOGIN: 'initialLogin',
    INTERACTION_MODEL_SYNC: 'interactionModelSync',
    MANIFEST_SYNC: 'manifestSync',
    PROFILE_MANAGER: 'profileManager',
    SIMULATE_SKILL: 'simulateSkill',
    TOOLKIT_UPDATE: 'toolkitUpdate',
    WELCOME_SCREEN: 'welcomeScreen'
}

export const TREE_VIEW_IDS = {
    SKILLS_CONSOLE: 'askContainer.skills-console',
    HELP: 'askContainer.help-view',
    SKILL_ACTIONS: 'askContainer.skill-actions'
};

export const SKILLS_CONSOLE_ITEMS = {
    CREATE_NEW_SKILL: 'Create a skill',
    DOWNLOAD_SKILL: 'Download and edit skill',
    OPEN_LOCAL_SKILL: 'Open local skill',
    PROFILE_MGR: 'Profile manager',
    SIGN_IN: 'Sign in'
};

export const SKILL_ACTION_ITEMS = {
    MANIFEST: {
        LABEL: "Skill manifest",
        ITEMS: {
            EDITOR: 'Edit in console',
            DOWNLOAD: 'Download'
        }
    },
    IM: {
        LABEL: 'Interaction model',
        ITEMS: {
            EDITOR: 'Edit in console',
            DOWNLOAD: 'Download'
        }
    },
    DEPLOY: {
        LABEL: 'Deploy skill'
    },
    TEST: {
        LABEL: 'Test skill',
        ITEMS: {
            OPEN: 'Open simulator',
            REPLAY: 'Replay session',
            VIEWPORT: 'Change viewport profile'
        }
    },
    ALEXA_PRESENTATION_LANGUAGE: EXTENSION_TREE_VIEW_CONFIG.ALEXA_PRESENTATION_LANGUAGE
};

export const HELP_VIEW_ITEMS = {
    WHATS_NEW: `What's new`,
    GETTING_STARTED: 'Getting started',
    GETTING_STARTED_SDK: 'SDK resources',
    GETTING_STARTED_ASK_SDK: 'Custom skills',
    GETTING_STARTED_SMAPI_SDK: 'Skill Management API',
    GETTING_STARTED_CLI: 'ASK CLI',
    GETTING_STARTED_VSCODE: 'ASK plugin'
};

export const EXTENSION_STATE_KEY = {
    CACHED_SKILLS: 'AskContainer.HostedSkillsCache',
    LWA_PROFILE: 'LwaProfile',
    ENV: 'env',
    CLIENT_ID: 'CLIENT_ID',
    CLIENT_SECRET: 'CLIENT_SECRET',
    ASK_LWA_AUTHORIZE_HOST: 'ASK_LWA_AUTHORIZE_HOST',
    ASK_LWA_TOKEN_HOST: 'ASK_LWA_TOKEN_HOST',
    ASK_SMAPI_SERVER_BASE_URL: 'ASK_SMAPI_SERVER_BASE_URL',
    WS_SKILLS: 'WORKSPACE_SKILLS',
    CURRENT_VERSION: 'currentVersion',
    LOG_LEVEL: 'logLevel',
    CONFIG_SECTION_NAME: 'askToolkit',
    SHOW_WELCOME_SCREEN: 'showWelcomeScreen',
    DID_FIRST_TIME_LOGIN: 'didFirstTimeLogin'
};

export const AUTH = {
    PLACEHOLDER_ENVIRONMENT_VAR_PROFILE_NAME: '__ENVIRONMENT_ASK_PROFILE__',
    DEFAULT_CLIENT_ID: 'amzn1.application-oa2-client.aad322b5faab44b980c8f87f94fbac56',
    DEFAULT_CLIENT_SECRET: '1642d8869b829dda3311d6c6539f3ead55192e3fc767b9071c888e60ef151cf9',
    SIGNIN_URL: 'https://www.amazon.com/ap/signin',
    SIGNIN_PATH: '/ap/signin',
};

export const DYNAMIC_CONTENT = {
    BLOG_POSTS_JSON: 'http://d177gaoewxhqz4.cloudfront.net/skills_blog.json',
    ASK_UPDATES_JSON: 'http://d177gaoewxhqz4.cloudfront.net/ask_updates.json'
};

export const DEV_CONSOLE_ENDPOINT = 'https://developer.amazon.com/alexa/console/ask';

export const SKILL_ACTION_URLS = {
    IMODEL_EDITOR: (skillId: string, locale: string): string => `${DEV_CONSOLE_ENDPOINT}/build/custom/${skillId}/development/${locale}/intents`,
    SIMULATOR: (skillId: string, locale: string): string => `${DEV_CONSOLE_ENDPOINT}/test/${skillId}/development/${locale}/`,
};

export const SKILL = {
    RESOURCES: {
        MANIFEST: 'manifest',
        INTERACTION_MODEL: 'interactionModel',
        HOSTED_SKILL_PROVISIONING: 'hostedSkillProvisioning',
        HOSTED_SKILL_DEPLOYMENT: 'hostedSkillDeployment'
    },
    STAGE: {
        DEVELOPMENT: 'development',
        LIVE: 'live',
        CERTIFICATION: 'certification'
    },
    BUILD_STATUS: {
        SUCCESS: 'SUCCEEDED',
        FAILURE: 'FAILURE',
        IN_PROGRESS: 'IN_PROGRESS'
    },
    PROVISIONING_STATUS: {
        SUCCESS: 'SUCCEEDED',
        FAILURE: 'FAILED',
        IN_PROGRESS: 'IN_PROGRESS'
    },
    HOSTED_DEPLOYMENT_STATUS: {
        SUCCESS: 'SUCCEEDED',
        FAILURE: 'FAILED',
        IN_PROGRESS: 'IN_PROGRESS'
    },
    INTERACTION_MODEL_STATUS: {
        SUCCESS: 'SUCCEEDED',
        FAILURE: 'FAILED',
        IN_PROGRESS: 'IN_PROGRESS'
    },
    MANIFEST_STATUS: {
        SUCCESS: 'SUCCEEDED',
        FAILURE: 'FAILED',
        IN_PROGRESS: 'IN_PROGRESS'
    },
    SIMULATION_STATUS: {
        SUCCESS: 'SUCCESSFUL',
        FAILURE: 'FAILED',
        IN_PROGRESS: 'IN_PROGRESS'
    },
    VALIDATION_STATUS: {
        SUCCESS: 'SUCCESSFUL',
        FAILURE: 'FAILED',
        IN_PROGRESS: 'IN_PROGRESS'
    },
    MODEL_VERSION: {
        CURRENT: '~current'
    },
    PACKAGE_STATUS: {
        SUCCEEDED: 'SUCCEEDED',
        FAILED: 'FAILED',
        IN_PROGRESS: 'IN_PROGRESS',
        ROLLBACK_SUCCEEDED: 'ROLLBACK_SUCCEEDED',
        ROLLBACK_FAILED: 'ROLLBACK_FAILED',
        ROLLBACK_IN_PROGRESS: 'ROLLBACK_IN_PROGRESS'
    },
    GIT_HOOKS_SCRIPTS: {
        PRE_PUSH: {
            URL: 'https://ask-tools-core-content.s3-us-west-2.amazonaws.com/git-hooks-templates/pre-push/pre-push',
            CHMOD: '777'
        },
        ASK_PRE_PUSH: {
            URL: 'https://ask-tools-core-content.s3-us-west-2.amazonaws.com/git-hooks-templates/pre-push/ask-pre-push',
            CHMOD: '777'
        }
    },    
    GIT_CREDENTIAL_SCRIPT: {
        URL: "https://ask-tools-core-content.s3-us-west-2.amazonaws.com/helpers/prod/git-credential-helper",
        CHMOD: "777"
    },
    S3_SCRIPTS_AUTH_INFO: {
        URL: "https://ask-tools-core-content.s3-us-west-2.amazonaws.com/auth_info"
    },
    MIN_SKILL_NAME_LENGTH: 2,
    MAX_SKILL_NAME_LENGTH: 50,
};

export const SKILL_FOLDER = {
    HIDDEN_ASK_FOLDER: '.ask',
    ASK_RESOURCES_JSON_CONFIG: 'ask-resources.json',
    ASK_STATES_JSON_CONFIG: 'ask-states.json',
    SKILL_PACKAGE: {
        NAME: 'skill-package',
        CUSTOM_MODELS: path.join('interactionModels', 'custom'),
        ISPS: 'isps',
        MANIFEST: 'skill.json',
        ASSETS: 'assets',
    },
    LAMBDA: {
        NAME: 'lambda',
        NODE_MODULES: 'node_modules'
    },
    SKILL_MANIFEST: 'skill.json',
    MODELS: 'models',
    ISPS: 'isps',
    HIDDEN_VSCODE: '.vscode',
    HIDDEN_GIT_FOLDER: {
        NAME: '.git',
        HOOKS: {
            NAME: 'hooks',
            PRE_PUSH: 'pre-push'
        }
    },
    BACK_UP: '.skill-package-backup'
};

export const SYSTEM_ASK_FOLDER = {
    HIDDEN_ASK_FOLDER: '.ask',
    AUTH_INFO: 'auth_info',
    SCHEMA_FOLDER: {
        NAME: 'schema',
        SKILL_PACKAGE: 'skillPackageSchema.json'
    },
    SCRIPTS_FOLDER: {
        NAME: 'scripts',
        ASK_PRE_PUSH: 'ask-pre-push',
        GIT_CREDENTIAL_HELPER: 'git-credential-helper',
    }
};

export const TEMPLATES = {
    TEMPLATE_ASK_CLI_BRANCH: 'ask-cli-x',
    TEMPLATE_ASK_TOOLS_BRANCH: 'ask-tools',
    TEMPLATES_BY_CODE_LANGUAGE: {
        NodeJS: "https://github.com/alexa/skill-sample-nodejs-hello-world.git",
        Python: "https://github.com/alexa/skill-sample-python-helloworld-classes.git",
        Java: "https://github.com/alexa/skill-sample-java-premium-hello-world.git" 
    }
}

export const MASTER_BRANCH_SKILL_MODELS_URL =
    'https://raw.githubusercontent.com/alexa/skill-sample-nodejs-hello-world/master/models';
export const MASTER_BRANCH_SKILL_MANIFEST_URL =
    'https://raw.githubusercontent.com/alexa/skill-sample-nodejs-hello-world/master/skill.json';


export const SCHEMA = {
    SKILL_PACKAGE: 'skillPackageStructure',
    MANIFEST: 'manifest',
};

export const BASE_RESOURCES_CONFIG = {
    askToolkitResourcesVersion: '2020-04-15',
    profiles: {}
};

export const BASE_STATES_CONFIG = {
    askToolkitStatesVersion: '2020-04-15',
    profiles: {}
};

export const ASK_RESOURCES_JSON = {
    PROFILES: 'profiles',
    SKILL_ID: 'skillId',
    SKILL_METADATA: {
        NAME: 'skillMetadata',
        SRC: 'src',
    },
    CODE: {
        NAME: 'code',
        SRC: 'src',
    },
    SKILL_INFRASTRUCTURE: {
        NAME: 'skillInfrastructure',
        TYPE: 'type',
        USER_CONFIG: {
            NAME: 'userConfig',
            RUNTIME: 'runtime',
            HANDLER: 'handler'
        }
    }
}

export const ASK_STATES_JSON = {
    PROFILES: 'profiles',
    SKILL_ID: 'skillId',
    SKILL_METADATA: {
        NAME: 'skillMetadata',
        ETAG: 'eTag',
        LAST_DEPLOY_HASH: 'lastDeployHash'
    }
}

export const MANIFEST_JSON = {
    NAME: 'manifest',
    PUBLISHING_INFORMATION: {
        NAME: 'publishingInformation',
        LOCALES: {
            NAME: 'locales',
            SKILL_NAME: 'name'
        }
    },
    APIS: {
        NAME: 'apis',
        CUSTOM: {
            NAME: 'custom'
        }
    }
}

export const SKILL_STATUS_MODEL = {
    MANIFEST: {
        NAME: 'manifest',
        LAST_UPDATE_REQUEST: {
            NAME: 'lastUpdateRequest',
            STATUS: 'status',
            ERRORS: {
                NAME: 'errors',
            }
        }
    },
    INTERACTION_MODEL: {
        NAME: 'interactionModel',
        LAST_UPDATE_REQUEST: {
            NAME: 'lastUpdateRequest',
            STATUS: 'status',
            ERRORS: 'errors',
            BUILD_DETAILS: {
                NAME: 'buildDetails',
            }
        }
    },
    HOSTED_SKILL_PROVISIONING: {
        NAME: 'hostedSkillProvisioning',
        LAST_UPDATE_REQUEST: {
            NAME: 'lastUpdateRequest',
            STATUS: 'status',
            ERRORS: {
                NAME: 'errors',
            }
        }
    }
}

export const BRANCH_TO_STAGE: { [key: string]: string} = {
    prod: 'live',
    master: 'development'
};

export const ALEXA_RESPONSE_TYPES = {
    SPEECH: 'Speech'
};

export const SIMULATOR_WEBVIEW_MESSAGES = {
    ENABLE_SKILL: 'enable_skill',
    DISABLE_SKILL: 'disable_skill',
    ENABLED_SKILL: 'enabled_skill',
    DISABLED_SKILL: 'disabled_skill',
    CHECK_SKILL_STATUS: 'check_skill_status',
    CHECK_AVAILABLE_LOCALES: 'check_available_locales',
    UPDATE_LOCALE: 'update_locale'
};

export const SIMULATOR_MESSAGE_TYPE = {
    SKILL_STATUS: 'skill_status',
    LOCALE: 'locale',
    UTTERANCE: 'utterance',
    REPLAY: 'replay',
    EXPORT: 'export',
    ACTION: 'action',
    VIEWPORT: 'viewport',
    EXCEPTION: 'exception'
};

export const TELEMETRY_EVENTS = {
    CREATE_HOSTED_SKILL_TELEMETRY_EVENT: 'ask.new.createAlexaHosted',
    CREATE_SELF_HOSTED_SKILL_TELEMETRY_EVENT: 'ask.new.createSelfHosted',
    DEPLOY_HOSTED_SKILL_TELEMETRY_EVENT: 'askContainer.skillsConsole.deployHostedSkill.buildClick',
    DEPLOY_SELF_HOSTED_SKILL_TELEMETRY_EVENT: 'askContainer.skillsConsole.deploySelfHostedSkill.buildClick',
    CLONE_HOSTED_SKILL_TELEMETRY_EVENT: 'askContainer.skillsConsole.cloneAlexaHostedSkill',
    CLONE_SELF_HOSTED_SKILL_TELEMETRY_EVENT: 'askContainer.skillsConsole.cloneSelfHostedSkill',
}

export const SIMULATION_IN_PROGRESS = 'Simulation in progress';

export const LOCALHOST_PORT = 9090;

export const EN_US_LOCALE = 'en-US';

export const DEFAULT_SESSION_MODE = 'DEFAULT';

export const NEW_SESSION_MODE = 'FORCE_NEW_SESSION';

export const DEFAULT_PROFILE = 'default';

export const DEFAULT_ENCODING = 'utf8';

export const ERRORS = {
    SKILL_ACCESS: (currentProfile: string, skillProfile: string): string => `'${currentProfile}' profile doesn't have access to the skill. Please use '${skillProfile}' profile.`,
    SIMULATION_TIMEOUT: 'Skill simulation request timed out. Please try again.',
    SKILL_ENABLEMENT_FAIL: 'We failed to enable the skill simulator. Try again.',
    SKILL_DISABLEMENT_FAIL: 'We failed to disable the skill simulator. Try again.',
    SIMULATION_REQUEST_FAIL: 'The simulator did not respond to your request. Try again.',
    SKILL_MANIFEST_REQUEST_FAIL: 'Could not access skill manifest information.',
    UNRECOGNIZED_ALEXA_RESPONSE_TYPE: (responseType: string|undefined): string => `The simulator returned an unrecognized Alexa response of type '${responseType}.'`,
    UNDEFINED_SIMULATION_ID: 'Error: The simulator ID was invalid. Try again.',
    UNRECOGNIZED_SIMULATION_RETURN_MESSAGE: 'Error: Unrecognized simulation return message. Message must contain either \'error\' or \'alexaResponse\'.',
    UNRECOGNIZED_MESSAGE_FROM_WEBVIEW: 'Error: Unrecognized message sent from Webview.',
    MISSING_INFO_LOCAL_DEBUG: (cause: string): string => `Missing info: '${cause}'. Please configure manually.`,
    OPEN_REPLAY_FILE_FAIL: (filePath: string|undefined): string => `Open replay file failed. File path: '${filePath}'. Please check the json file.`,
    REPLAY_FAILED: 'Import replay file failed: This file is empty. Select another JSON file to replay.',
    REPLAY_FAILED_ID: 'Import replay file failed: Skill id does not match. Select another JSON file to replay.',
    REPLAY_FAILED_LOCALE: 'Failed to import replay file because the skill locale does not match the currently open skill.',
    REPLAY_FAILED_ENABLE: 'Failed to import replay file because the Simulator is off. Turn the Skill stage to "development" before importing a replay file.',
    EXPORT_FAILED: 'There is no utterance to export, please input some utterances.',
    EXPORT_FILE_FAIL:  (filePath: string|undefined): string => `The file '${filePath}' could not be saved. Please make sure you have access to write to this path.`,
    PROFILE_ERROR: (profile: string|undefined): string =>`This skill cannot be accessed by the current profile: ${profile}. To access this skill, switch to a different profile.`
};

export const GIT_MESSAGES = {
    GIT_NOT_FOUND: 'Git not found. Install it or configure it using the \'git.path\' setting.'
};

export const LOCAL_DEBUG = {
    NODE_DEPENDENCIES: {
        LANG_TYPE: 'node',
        DEP_REGEX: '**/node_modules/ask-sdk-local-debug/**/LocalDebuggerInvoker.js',
        DEP_INSTALL_MSG: 'ask-sdk-local-debug package not found. Please install the ask-sdk-local-debug package from npm'
    },
    PYTHON_DEPENDENCIES: {
        LANG_TYPE: 'python',
        SITE_PKGS_CHECK: (pythonInterpreter: string): string => `"${pythonInterpreter}" -c "import site; print(site.getsitepackages())"`,
        DEP_PATH: path.join('ask_sdk_local_debug', 'local_debugger_invoker.py'),
        DEP_INSTALL_MSG: 'ask-sdk-local-debug package not found. Please install the ask-sdk-local-debug package from pypi'
    },
    DEBUG_PATH_ERROR: (languageType: string): string => `Invalid language type '${languageType}' provided`
};

export const CLI_HOSTED_SKILL_TYPE = "@ask-cli/hosted-skill-deployer";
export const SKILL_NOT_DEPLOYED_MSG = 'This skill has not been previously deployed. Some extension functionalities will be unavailable until an initial deployment.';
export const MULTIPLE_SKILLS_MSG = 'Multiple skills are open in the workspace, so some Alexa Toolkit Extension features will not work. Alexa Toolkit Extension works best when only one skill is open.';
export const MULTIPLE_SKILLS_PRESENT_MSG = 'The workspace already contains one or more skill folders. Alexa Toolkit Extension works best when only one skill is open. Do you want to open the skill in a new workspace?';
export const CLI_V1_GLOB_PATTERN = '**/.ask/config';
export const CLI_V1_SKILL_MSG = 'This skill contains unsupported skill folder structure. Some Alexa Toolkit Extension features will not work. Please follow [this guide](https://developer.amazon.com/en-US/docs/alexa/smapi/ask-cli-v1-to-v2-migration-guide.html#new-skill-project-structure-required-for-deployment-with-cli-v2) to upgrade your skill folder structure.';
export const SEEN_TELEMETRY_NOTIFICATION_MESSAGE_KEY = 'seenTelemetryNotificationMessage';
export const TELEMETRY_NOTIFICATION_MESSAGE = 
'To maintain and improve the Alexa Skills Kit extension, we collect anonymous ' + 
'metrics related to usage and performance. To change this setting, go to the ' + 
'"Alexa Skills Kit Configuration" section in your user settings.';

export const SKILL_PACKAGE_FORMAT_GUID = 'Please follow [this guide](https://developer.amazon.com/en-US/docs/alexa/smapi/skill-package-api-reference.html#skill-package-format) to upgrade your skill-package folder structure. For more detailed skill-package format, please check .ask/schema/skillPackageSchema.json.';