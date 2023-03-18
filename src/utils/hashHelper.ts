/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import * as folderHash from "folder-hash";

export async function getHash(sourcePath: string): Promise<folderHash.HashElementNode> {
  const option = {algo: "sha1"};
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    folderHash.hashElement(sourcePath, "", option, (error, result) => {
      if (error !== null && error !== undefined) {
        reject(error);
      }
      // @ts-ignore
      resolve(result);
    });
  });
}
