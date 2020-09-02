export const AUTH = {
    PLACEHOLDER_ENVIRONMENT_VAR_PROFILE_NAME: '__ENVIRONMENT_ASK_PROFILE__',
    DEFAULT_CLIENT_ID: 'amzn1.application-oa2-client.aad322b5faab44b980c8f87f94fbac56',
    DEFAULT_CLIENT_SECRET: '1642d8869b829dda3311d6c6539f3ead55192e3fc767b9071c888e60ef151cf9',
    SIGNIN_URL: 'https://www.amazon.com/ap/signin',
    SIGNIN_PATH: '/ap/signin',
    DEFAULT_LWA_AUTHORIZE_HOST: 'https://www.amazon.com',
    DEFAULT_ASK_LWA_TOKEN_HOST: 'https://api.amazon.com'
};

export const EXTENSION_STATE_KEY = {
    CACHED_SKILLS: 'AskContainer.HostedSkillsCache',
    LWA_PROFILE: 'LwaProfile',
    CLIENT_ID: 'CLIENT_ID',
    CLIENT_SECRET: 'CLIENT_SECRET',
    ASK_LWA_AUTHORIZE_HOST: 'ASK_LWA_AUTHORIZE_HOST',
    ASK_LWA_TOKEN_HOST: 'ASK_LWA_TOKEN_HOST',
    ASK_SMAPI_SERVER_BASE_URL: 'ASK_SMAPI_SERVER_BASE_URL'
};

export const FILE_PATH = {
    ASK: {
        HIDDEN_FOLDER: '.ask',
        PROFILE_FILE: 'cli_config'
    }
};

export const CONFIGURATION = {
    FILE_PERMISSION: {
        USER_READ_WRITE: '0600'
    },
    JSON_DISPLAY_INTENT: 2,
};