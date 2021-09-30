/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import {is, isEmpty} from "ramda";

export function isNonEmptyString(str: string | undefined): boolean {
  return str !== undefined && is(String, str) && !isEmpty(str);
}

export function isNonBlankString(str: string | undefined): boolean {
  return isNonEmptyString(str) && str !== undefined && !!str.trim();
}

/**
 * Check if input string is a valid lambda function name
 * @param {string} str
 */
export function isLambdaFunctionName(str: string): boolean {
  if (!isNonBlankString(str)) {
    return false;
  }

  // This regex can be used to check if the str
  // could be a valid lambda function name
  const lambdaFunctionNameRegex = /^([a-zA-Z0-9-_]+)$/;
  return lambdaFunctionNameRegex.test(str);
}

/**
 * Check if the input string is a meaningful diff result or only contains header message
 */
export function hasDiffContent(str: string): boolean {
  if (!isNonBlankString(str)) {
    return false;
  }

  const lines = str.split(/\r\n|\n/);

  // Exclude the case when string only contains three lines of headers (diff example shown as below):
  // ===================================================================
  // --- local  {filename}
  // +++ remote {filename}
  // (new line)
  if (lines.length <= 4) {
    return false;
  }

  // Exclude when there is no line starting with "-" or "+"
  for (const line of lines) {
    if ((line.startsWith("-") && !line.startsWith("---")) || (line.startsWith("+") && !line.startsWith("+++"))) {
      return true;
    }
  }
  return false;
}

/**
 * Filter non-alphanumeric in a string and remove the character
 * @param {string} str
 */
export function filterNonAlphanumeric(str: string): string {
  if (!str) {
    return str;
  }
  return str.replace(/[^a-zA-Z0-9-]+/g, "");
}
