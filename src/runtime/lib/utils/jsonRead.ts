/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import { readFileSync } from 'jsonfile';

export function readFile(filePath: string): any {
    var file: any;
    try {
        file = readFileSync(filePath);
    } catch (e) {
        console.error('Invalid json: ' + filePath);
        return null;
    }
    return file;
}

export function readString(str: string): any {
    var jsonObj : any;
    try {
        jsonObj = JSON.parse(str);
    } catch (e) {
        console.error('Invalid json string: ' + str);
        return null;
    }
    return jsonObj;
}

export function getProperty(jsonObject: any, track: string): any {
    const trackArray: string[] = track.split('.').slice(1);
    var property: any = jsonObject;
    for (let i = 0; i < trackArray.length; i++) {
        if (property.hasOwnProperty(trackArray[i])) {
            property = property[trackArray[i]];
        } else {
            console.log('The property "' + trackArray[i] + '" does not exist.');
            return null;
        }
    }
    return property;
}