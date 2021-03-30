/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
export interface Resource {
    label?: string;
}

export class SmapiResource<T> {
    label?: string; 
    data: T;

    constructor(data: T, label?: string) {
        this.data = data;
        this.label = label;
    }
}
export interface CustomResource extends Resource {
    description: string;
    hasChildren?: boolean;
}