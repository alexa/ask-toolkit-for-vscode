/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/

import { v4 as uuid } from 'uuid';
import { Logger } from '../../logger';
import { IEvent, IEventPack, IHeader } from './avsInterface';

/**
 * API: https://developer.amazon.com/en-US/docs/alexa/alexa-voice-service/presentation-apl.html#userevent
 * @param userEvent 
 * @param presentationToken 
 */
export function createUserEventPayload(userEvent, presentationToken): string {
    Logger.verbose(`Calling method: avsPayload.createUserEventPayload`);
    const requestId = uuid().toString();
    const header: IHeader = {
        namespace: 'Alexa.Presentation.APL',
        name: 'UserEvent',
        messageId: uuid().toString(),
        dialogRequestId: requestId
    };
    const event: IEvent = {
        header,
        payload: {
            presentationToken,
            arguments: userEvent.arguments,
            source: userEvent.source,
            components: userEvent.components,
            dialogRequestId: requestId
        }
    };
    const eventPack: IEventPack = {
        event,
        context: []
    };
    const payload = JSON.stringify(eventPack);
    const requestString = generateRequestBody(payload);
    return requestString;
}

/**
 * API: https://developer.amazon.com/en-US/docs/alexa/alexa-voice-service/speechrecognizer.html#recognize
 * @param speechToken 
 */
export function createRecognizeEventPayload(speechToken: string): string {
    Logger.verbose(`Calling method: avsPayload.createRecognizeEventPayload`);
    const header1: IHeader = {
        namespace: 'SpeechRecognizer',
        name: 'Recognize',
        messageId: uuid().toString(),
        dialogRequestId: uuid().toString()
    };
    const event1: IEvent = {
        header: header1,
        payload: {
            profile: 'CLOSE_TALK',
            format: 'AUDIO_L16_RATE_16000_CHANNELS_1'
        }
    };
    const header2: IHeader = {
        namespace: 'SpeechSynthesizer',
        name: 'SpeechState'
    };
    const event2: IEvent = {
        header: header2,
        payload: {
            token: speechToken,
            offsetInMilliseconds: 1000,
            playerActivity: 'FINISHED'
        }
    };
    const header3: IHeader = {
        namespace: 'AudioActivityTracker',
        name: 'ActivityState'
    };
    const event3: IEvent = {
        header: header3,
        payload: {
            dialog: {
                interface: 'SpeechSynthesizer',
                idleTimeInMilliseconds: 1000
            }
        }
    };
    const eventPack: IEventPack = {
        event: event1,
        context: [event2, event3]
    };
    const payload = JSON.stringify(eventPack);
    const requestString = generateRequestBody(payload);
    return requestString;
}

/**
 * API: https://developer.amazon.com/en-US/docs/alexa/alexa-voice-service/system.html#synchronizestate
 */
export function createNewSessionEventPayload(): string {
    Logger.verbose(`Calling method: avsPayload.createLocaleUpdateEventPayload`);
    const header: IHeader = {
        namespace: 'System',
        name: 'SynchronizeState',
        messageId: uuid().toString()
    };
    const event: IEvent = {
        header,
        payload: {}
    };
    const eventPack: IEventPack = {
        event,
        context: []
    };
    const payload = JSON.stringify(eventPack);
    const requestString = generateRequestBody(payload);
    return requestString;
}

/**
 * API: https://developer.amazon.com/en-US/docs/alexa/alexa-voice-service/settings.html#settingsupdated
 * @param locale 
 */
export function createLocaleUpdateEventPayload(locale: string): string {
    Logger.verbose(`Calling method: avsPayload.createLocaleUpdateEventPayload`);
    const header: IHeader = {
        namespace: 'Settings',
        name: 'SettingsUpdated',
        messageId: uuid().toString()
    };
    const event: IEvent = {
        header,
        payload: { 'settings': [{ 'key': 'locale', 'value': locale }] }
    };
    const eventPack: IEventPack = {
        event,
        context: []
    };
    const payload = JSON.stringify(eventPack);
    const requestString = generateRequestBody(payload);
    return requestString;
}

export function generateRequestBody(payload: string): string {
    Logger.verbose(`Calling method: avsPayload.generateRequestBody`);
    const requestString = (
        START_JSON
        + payload
        + ('\r\n--' + SIMPLE_AVS_BOUNDARY + '\r\n').toString()
    );
    return requestString;
}

export const CAPABILITY_PAYLOAD = {
    'envelopeVersion': '20160207',
    'capabilities': [
        {
            'interface': 'SkillDebugger',
            'type': 'AlexaInterface', 'version': '0.1'
        },
        {
            'interface': 'Alexa.Presentation.APL',
            'type': 'AlexaInterface',
            'version': '1.0',
            'configurations': { 'runtime': { 'maxVersion': '1.5' } },
        },
        {
            'type': 'AlexaInterface',
            'interface': 'SpeechSynthesizer', 'version': '1.3'
        },
        {
            'type': 'AlexaInterface',
            'interface': 'System',
            'version': '1.0',
            'configurations': { 'locales': ['en-US', 'en-GB', 'de-DE', 'en-IN', 'en-AU', 'en-CA', 'fr-CA', 'ja-JP', 'fr-FR', 'es-ES', 'it-IT', 'es-MX', 'pt-BR', 'hi-IN', 'es-US'] },
        },
        {
            'interface': 'Alexa.Presentation',
            'type': 'AlexaInterface', 'version': '1.0'
        }
    ],
}

export const SIMPLE_AVS_BOUNDARY = 'simple-avs-message-boundary';
const START_JSON = (
    '--'
    + SIMPLE_AVS_BOUNDARY
    + '\r\nContent-Disposition: form-data; name="metadata"\r\n'
    + 'Content-Type: application/json; charset=UTF-8\r\n\r\n'
).toString();

export const IDENTIFIER = {
    SPEECHSYNTHESIZER_SPEAK: 'SpeechSynthesizer.Speak',
    APL_RENDERDOCUMENT: 'Alexa.Presentation.APL.RenderDocument',
    APL_EXECUTE_COMMANDS: 'Alexa.Presentation.APL.ExecuteCommands',
    DEBUGGING_INFO: 'SkillDebugger.CaptureDebuggingInfo',
    DEBUGGING_EXCEPTION: 'SkillDebugger.Exception',
}

//Region-endpoint mapping for AVS calls.
export const AVS_CONFIG = {
    ENDPOINT_VERSION: '/v20160207',
    REGION: {
        NA: 'https://alexa.na.gateway.devices.a2z.com',
        EU: 'https://alexa.eu.gateway.devices.a2z.com',
        FE: 'https://alexa.fe.gateway.devices.a2z.com',
    },
    CAPABILITIES: 'https://api.amazonalexa.com/v1/devices/@self/capabilities',
    AUTH_CODEPAIR: 'https://api.amazon.com/auth/O2/create/codepair',
    AUTH_TOKEN: 'https://api.amazon.com/auth/o2/token',
}

//Event type for AVS calls
export const AVS_EVENT_TYPE = {
    RECOGNIZE: 'recognize',
    USEREVENT: 'userEvent',
    LOCALE: 'locale',
    FORCE_NEW_SESSION: 'forceNewSession',
}

export const AVS_CONSTANTS = {
    UNAUTHORIZED_DEBUGGING_INFO_ACCESS: 'UNAUTHORIZED_DEBUGGING_INFO_ACCESS',
    ALEXA_ALL_SCOPE: 'alexa:all',
    DEVICE_CODE: 'device_code',
    REFRESH_TOKEN: 'refresh_token',
    CONTENT_DISPOSITION: 'Content-Disposition: form-data; name="audio"\r\n',
    CONTENT_TYPE: 'Content-Type:application/octet-stream\r\n\r\n',
    DEBUGGING_INFO_TYPE: {
        CONSIDERED_INTENTS: 'ConsideredIntents',
        SKILL_EXECUTION_INFO: 'SkillExecutionInfo',
    },
}

export const AVS_ERROR_MESSAGE = {
    GET_AUTH_CODE_FAILED: 'Failed to get device auth code.',
    GET_DEVICE_TOKEN_FAILED: 'Failed to get device token.',
}