/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import { Logger } from '../logger';

export function getCurrentDate(): string {
    Logger.verbose(`Calling method: getCurrentDate`);
    const date = new Date();
    let month: string | number = date.getMonth() + 1;
    let strDate: string | number = date.getDate();

    if (month <= 9) {
        month = "0" + month;
    }
    if (strDate <= 9) {
        strDate = "0" + strDate;
    }
    const currentDate: string = date.getFullYear().toString() + month + strDate
        + date.getHours() + date.getMinutes() + date.getSeconds();
    return currentDate;
}