/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
export async function promiseRetry<T>(retries: number, fn: () => Promise<T>): Promise<T>  {
    return fn().catch((err: Error) => {
        if(retries > 1) {
            return promiseRetry(retries - 1, fn);
        } else {
            return Promise.reject(err);
        }
    });
}