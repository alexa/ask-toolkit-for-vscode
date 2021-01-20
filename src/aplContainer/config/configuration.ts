import { Map } from 'immutable';
import * as path from 'path';
/*
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */
export const EXTENSION_CONFIG = {
  DEFAULT_PREFIX: 'ask.apl.container',
};

export const EXTENSION_COMMAND_CONFIG = {
  CHANGE_VIEWPORT_PROFILE: {
    NAME: `${EXTENSION_CONFIG.DEFAULT_PREFIX}.changeViewportProfile`,
    TITLE: 'Change viewport profile',
  },
  CREATE_APL_DOCUMENT_FROM_SAMPLE: {
    NAME: `${EXTENSION_CONFIG.DEFAULT_PREFIX}.createAplDocumentFromSample`,
    TITLE: 'Create APL Document',
  },
  RENDER_APL_DOCUMENT: {
    NAME: `${EXTENSION_CONFIG.DEFAULT_PREFIX}.renderAplTemplate`,
    TITLE: 'Preview APL Document',
  },
  DOWNLOAD_APL_DOCUMENT: {
    NAME: `${EXTENSION_CONFIG.DEFAULT_PREFIX}.downloadAplDocument`,
    TITLE: 'Download APL Document',
  },
};

export const EXTENSION_TREE_VIEW_CONFIG = {
  ALEXA_PRESENTATION_LANGUAGE: {
    ITEMS: {
      CREATE_APL_DOCUMENT: {
        LABEL: 'Create',
      },
      CHANGE_VIEWPORT_PROFILE: {
        LABEL: 'Change viewport profile',
      },
      PREVIEW_APL_DOCUMENT: {
        LABEL: 'Preview',
      },
      DOWNLOAD_APL_DOCUMENT: {
        LABEL: 'Download',
      },
    },
    LABEL: 'Alexa Presentation Language (APL)',
  },
};

/**
 * A Map storing Sample Template ID and Sample Template Name pairs
 */
export const SAMPLE_TEMPLATE_ID_TO_NAME_MAP: Map<string, string> = Map([
  ['LONG_TEXT_SAMPLE', 'Long Text Sample'],
  ['IMAGE_RIGHT_DETAIL_SAMPLE', 'Image Right Detail Sample'],
  ['IMAGE_LEFT_DETAIL_SAMPLE', 'Image Left Detail Sample'],
  ['SHORT_TEXT_SAMPLE', 'Short Text Sample'],
  ['IMAGE_DISPLAY_SAMPLE', 'Image Display Sample'],
  ['TEXT_FORWARD_LIST_SAMPLE', 'Text Forward List Sample'],
  ['IMAGE_FORWARD_LIST_SAMPLE', 'Image Forward List Sample'],
  ['START_FROM_SCRATCH', 'Start From Scratch'],
]);

/**
 * All the file path follows design doc at:
 * https://wiki.labcollab.net/confluence/pages/viewpage.action?spaceKey=Doppler&title=Add+APL+Template+Asset+in+Skill+Package+API+Review
 */
/**
 * The root path for visual assets relative to skill-package
 */
export const DISPLAY_DIR_ROOT_PATH_RELATIVE_TO_SKILL_PACAKGE = path.join('response', 'display');

/**
 * The relative path of APL document
 */
export const APL_DOCUMENT_FILE_PATH = 'document.json';

/**
 * The relative path of datasources
 */
export const DATASOURCES_FILE_PATH = path.join('datasources', 'default.json');

/**
 * The relative path of sources
 */
export const SOURCES_FILE_PATH = path.join('sources', 'default.json');

/**
 * The resource name pattern
 */
const RESOURCE_NAME_REGEX_STRING = '([a-zA-Z0-9._-]+)';

/**
 * The resource name pattern in path
 * For path regexp, we will do loose check on resource name
 */
const RESOURCE_NAME_IN_PATH_REGEX_STRING = '(.+)';

/**
 * The regex path of resource name
 * Used for resource name validation when creating APL from sample
 */
export const RESOURCE_NAME_REGEX = new RegExp(
  `^${RESOURCE_NAME_REGEX_STRING}$`
);

/**
 * The regex path of APL document
 */
export const DOCUMENT_PATH_REGEX: RegExp = /(\\|\/)response(\\|\/)display(\\|\/).+(\\|\/)document.json/;

/**
 * The regex path of datasources
 */
export const DATA_PATH_REGEX: RegExp = /(\\|\/)response(\\|\/)display(\\|\/)(.+)(\\|\/)datasources(\\|\/)default.json/;

/**
 * The regex path of document, datasources, sources relative to skill-package
 * Used for extracting APL assets from skill package zip
 */
export const DOCUMENT_PATH_REGEX_RELATIVE_TO_SKILL_PACKAGE: RegExp = /response(\\|\/)display(\\|\/)([a-zA-Z0-9._-]+)(\\|\/)document.json/;
export const DATASOURCES_PATH_REGEX_RELATIVE_TO_SKILL_PACKAGE: RegExp = /response(\\|\/)display(\\|\/)([a-zA-Z0-9._-]+)(\\|\/)datasources(\\|\/)default.json/;
export const SOURCES_PATH_REGEX_RELATIVE_TO_SKILL_PACKAGE: RegExp = /response(\\|\/)display(\\|\/)([a-zA-Z0-9._-]+)(\\|\/)sources(\\|\/)default.json/;
