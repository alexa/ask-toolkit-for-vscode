/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import { readFileSync, writeFileSync } from 'jsonfile';

export function read(filePath: string): any {
    try {
        const content: any = readFileSync(filePath);
        return content;
    } catch (e) {
        throw new Error('Invalid json: ' + filePath);
    }
}

export function write(filePath: string, jsonObject: any): void {
    try {
        writeFileSync(filePath, jsonObject, {spaces: 2});
    } catch (e) {
        throw new Error('Invalid file, cannot write to: ' + filePath);
    }
}

export function writeToProperty(filePath: string, propertyPathArray: string[], writeObject: any): void {
    const jsonObject: any = read(filePath);
    insertObjectToObject(jsonObject, propertyPathArray, writeObject);
    write(filePath, jsonObject);
}

export function deleteProperty(filePath: string, propertyPathArray: string[]): boolean {
    const jsonObject: any = read(filePath);
    deletePropertyFromJsonObject(jsonObject, propertyPathArray);
    write(filePath, jsonObject);
    return true;
}

export function getProperty(filePath: string, propertyPathArray: string[]): any {
    const jsonObject: any = read(filePath);
    return getPropertyValueFromObject(jsonObject, propertyPathArray);
}

export function getPropertyValueFromObject(jsonObject: any, propertyPathArray: string[]): any {
    var targetObject: any = jsonObject;
    for (let index = 0; index < propertyPathArray.length - 1; index++) {
        if (!targetObject || !targetObject.hasOwnProperty(propertyPathArray[index])) {
            return null;
        }
        targetObject = targetObject[propertyPathArray[index]];
    }

    if (!targetObject) {
        return null;
    }
    
    return targetObject[propertyPathArray[propertyPathArray.length - 1]];
}

export function deletePropertyFromJsonObject(jsonObject: any, propertyPathArray: string[]): boolean {
    var targetObject: any = jsonObject;
    for (let index = 0; index < propertyPathArray.length - 1; index++) {
        if (!targetObject.hasOwnProperty(propertyPathArray[index])) {
            return false;
        }
        targetObject = targetObject[propertyPathArray[index]];
    }
    delete targetObject[propertyPathArray[propertyPathArray.length - 1]];
    return true;
}

export function insertObjectToObject(jsonObject: any, propertyPathArray: string[], writeObject: any): void {
    var targetObject: any = jsonObject;
    for (let index = 0; index < propertyPathArray.length - 1; index++) {
        if (!targetObject.hasOwnProperty(propertyPathArray[index])) {
            if (typeof targetObject !== 'object') {
                break;
            }
            targetObject[propertyPathArray[index]] = {};
        }
        targetObject = targetObject[propertyPathArray[index]];
    }

    if (typeof targetObject === 'object') {
        targetObject[propertyPathArray[propertyPathArray.length - 1]] = writeObject;
        return jsonObject;
    }
    throw new Error('[Error]: cannot add property to non-object value. Please correct your target path');
}


export function addValueToProperty(jsonObject: any, propertyPathArray: string[], value: any): void {
    for (let index = 0; index < propertyPathArray.length-1; index++) {
        if (!jsonObject.hasOwnProperty(propertyPathArray[index]) && typeof jsonObject === 'object') {
            jsonObject[propertyPathArray[index]] = {};
        }
        jsonObject = jsonObject[propertyPathArray[index]];
    }
    jsonObject[propertyPathArray[propertyPathArray.length-1]] = value;
}