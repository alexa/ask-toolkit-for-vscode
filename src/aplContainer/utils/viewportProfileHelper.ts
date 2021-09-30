/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/

import {getDefaultViewport, IViewport, ViewportShape} from "apl-suggester";

/**
 * DP -> Pixel convert
 * https://aplspec.aka.corp.amazon.com/release-1.3/html/viewport.html?highlight=viewport#dpi
 * @param {number} dpValue - dp value
 * @param {number} dpi - dpi
 */
export const getPixelValueFromDpValue = (dpValue: number, dpi: number): number => {
  return Math.round((dpi / 160) * dpValue);
};

/**
 * IViewport -> IViewportCharacteristics (defined in APL webviewhost) convert
 * https://code.amazon.com/packages/APLViewhostWeb/blobs/6c9fe801a56e6b66213f930ba19a107e1c9462b7/--/js/apl-html/src/APLRenderer.ts#L36
 * @param {IViewport} activeViewport
 * @returns {any} - viewport characteristic used in APL webviewhost renderer config
 */
export function getViewportCharacteristicsFromViewPort(activeViewport: IViewport): any {
  if (activeViewport) {
    return {
      isRound: activeViewport.shape === ViewportShape.ROUND,
      height: getPixelValueFromDpValue(activeViewport.height, activeViewport.dpi),
      width: getPixelValueFromDpValue(activeViewport.width, activeViewport.dpi),
      dpi: activeViewport.dpi,
    };
  }
  return {
    isRound: false,
    height: 600,
    width: 1024,
    dpi: 160,
  };
}

export const DEFAULT_VIEWPORT_CHARACTERISTICS = getViewportCharacteristicsFromViewPort(getDefaultViewport());
export const DEFAULT_VIEWPORT_NAME = "Echo Show 1";
