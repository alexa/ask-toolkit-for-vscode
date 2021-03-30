/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/

export interface IDirective {
    header: IHeader;
    payload: any;
}

export interface IHeader {
    namespace: string;
    name: string;
    messageId?: string;
    dialogRequestId?: string;
}

export interface IPayload {
}

/**
 * This payload is for the directive of SkillDebugger.CaptureDebuggingInfo.
 */
export interface ISkillDebuggerPayload extends IPayload {
    skillId: string | null;
    type: string; // "ConsideredIntents" or "SkillExecutionInfo".
    content: any;
}

export interface ISkillDebuggerContent {
    invocationRequest: any;
    invocationResponse: any;
}

/**
 * This payload is for the directive of SpeechSynthesizer.speak.
 */
export interface ISpeakPayload extends IPayload {
    caption: any;
    format: string;
    token: string;
}

/**
 * This payload is for the directive of Alexa.Presentation.APL.RenderDocument.
 */
export interface IAplDocumentPayload extends IPayload {
    presentationToken: string;
    document: any;
    datasources?: any;
}

/**
 * This payload is for the directive of Alexa.Presentation.APL.ExecuteCommands.
 */
export interface IExecuteCommandsPayload extends IPayload {
    presentationToken: string;
    commands: any;
}

export interface IDeviceCodeResponse {
    user_code: string;
    device_code: string;
    verification_uri: string;
    expires_in: number;
    interval: number;
}

export interface IEvent {
    header: IHeader;
    payload: any;
}

export interface IEventPack {
    event: IEvent;
    context: IEvent[];
}