/*
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */
export const PROMPT_MESSAGES = Object.freeze({
    CREATE_SAMPLE_TEMPLATE: 'Choose a template',
    ENTER_NAME_FOR_TEMPLATE: 'Enter a name for the APL document',
    PREVIEW_APL_NO_APL_FOUND_IN_DIRECTORY: 'No APL documents found. Create an APL document before selecting Preview',
    TEMPLATE_NAMING_HINTS: 'Hint: Template name only accepts alphanumeric characters, periods, underscores and dashes',
    SYNC_APL_RESOURCE_RETRIEVING_INFORMATION: "Retrieving list of APL documents...",
    SYNC_APL_RESOURCE_NO_RESOURCE_FOUND_IN_CONSOLE: 'No APL documents found in the Alexa Developer Console. Create an APL document locally by clicking on Alexa Presentation Language > Create.'
});

export const ERROR_MESSAGES = Object.freeze({
    CHANGE_VIEWPORT_PROFILE_NO_APL_PREVIEW: 'There is no APL document selected. Choose an APL document and then choose Change viewport profile',
    CHANGE_VIEWPORT_PROFILE_NO_MATCHED_VIEWPORT: 'The selected viewport profile cannot be loaded.',
    CREATE_APL_FROM_SAMPLE_TEMPLATE_NAME_EXISTS: 'The APL document must have a unique name.',
    CREATE_APL_FROM_SAMPLE_NO_SAMPLE_TEMPLATE_FOUND: 'This APL document sample is not available.',
    PREVIEW_APL_NO_APL_DOCUMENT_FOUND: 'There is no document.json file in the APL document folder, so the APL cannot be previewed.',
    NO_SKILL_PACKAGE_FOUND: 'There was a failure loading APL from the zip file'
});

export const SUCCESS_MESSAGES = Object.freeze({
    CREATE_APL_FROM_SAMPLE_SUCCESS: 'Success: APL document created.',
    SYNC_APL_RESOURCE_SUCCESS: 'Success: APL document downloaded.'
});
