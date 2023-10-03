/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/

/**
 * Load documents of APL and do renderer
 * @param {object} renderer
 * @param {string} apl, the document from directive
 * @param {string} datasources, the datasources from directive
 * @param {string} deviceConfig, the viewport type
 * @param {string} fatherDiv
 * @param {object} onSendEvent
 */

async function loadAplDoc(renderer, apl, datasources, deviceConfig, deviceMode ,fatherDiv, onSendEvent) {
  if (renderer) {
    renderer.destroy();
    renderer = undefined;
  }
  const content = createContent(apl, datasources);

  const documentBody = fatherDiv === "" ? document.body : document.getElementById(fatherDiv);
  const aplDiv = document.getElementById("aplWrapper");
  if (aplDiv) {
    documentBody.removeChild(aplDiv);
  }
  const wrapper = document.createElement("div");
  const wrapperScale = documentBody.clientWidth / deviceConfig.width;
  wrapper.setAttribute("id", "aplWrapper");
  wrapper.style['transform-origin'] = 'top left';
  wrapper.style.transform = `scale(${wrapperScale})`;

  const div = document.createElement("div");
  div.setAttribute("id", "aplView");
  div.style.border = "1px solid #000";
  div.style.position = "relative";
  div.style.height = deviceConfig.height.toString();
  div.style.width = deviceConfig.width.toString();

  documentBody.appendChild(wrapper);
  wrapper.appendChild(div);

  const options = {
    content,
    onSendEvent,
    view: div,
    environment: {
      agentName: "APL Sandbox",
      agentVersion: "1.0",
      allowOpenUrl: true,
      disallowVideo: false,
    },
    viewport: deviceConfig,
    theme: "dark",
    developerToolOptions: {
      mappingKey: "auth-id",
      writeKeys: ["auth-banana", "auth-id"],
    },
    mode: deviceMode?.toUpperCase(),
    utcTime: Date.now(),
    localTimeAdjustment: -new Date().getTimezoneOffset() * 60 * 1000,
  };

  renderer = AplRenderer.default.create(options);
  window.renderer = renderer;
  await renderer.init();
}

function renderExecuteCommands(commands) {
  window.renderer.executeCommands(commands);
}

/**
 * Create content using AplRenderer
 * @param {string} apl, the document from directive
 * @param {string} datasources, the datasources from directive
 */
function createContent(apl, datasources) {
  const doc = apl;
  const content = AplRenderer.Content.create(doc);
  const data = datasources || "{}";
  if (data) {
    const jsonDoc = JSON.parse(doc);
    if (
      jsonDoc.mainTemplate &&
      jsonDoc.mainTemplate.parameters &&
      Array.isArray(jsonDoc.mainTemplate.parameters) &&
      jsonDoc.mainTemplate.parameters.length > 0
    ) {
      const parsedData = JSON.parse(data);
      jsonDoc.mainTemplate.parameters.forEach((name) => {
        if (typeof name === "string") {
          if (name === "payload") {
            content.addData(name, data);
          } else if (parsedData[name]) {
            content.addData(name, JSON.stringify(parsedData[name]));
          } else {
            content.addData(name, "{}");
          }
        }
      });
    }
  }
  return content;
}
