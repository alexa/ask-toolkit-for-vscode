/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import { isNonBlankString } from './stringUtils';

//TODO: Extend support for Promises.
export function resolver(chain: (string | undefined)[]): string {
    for (const item of chain) {
        if (item !== undefined && isNonBlankString(item)) {
            return item;
        }
    }
    return '';
}