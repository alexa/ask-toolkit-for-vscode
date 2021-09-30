/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/

//This file provides methods for avsClient and downChannelClient.
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as say from "say";
import * as vscode from "vscode";
import {WaveFile} from "wavefile";
import {SKILL_FOLDER} from "../../constants";
import {logAskError} from "../../exceptions";
import {Logger} from "../../logger";
import {makeDirSync} from "../fileHelper";
import {getSkillFolderInWs} from "./../workspaceHelper";
import {IDirective, IHeader} from "./avsInterface";
import webvtt = require("node-webvtt");

/**
 * Extract directive from the AVS response.
 * @param response
 */
export function parseJsonContent(response: Buffer): any {
  Logger.verbose(`Calling method: AVSClientUtil.parseJsonContent`);
  const jsonResponse = response.toString("utf-8");
  const tag = `{"directive":`;
  if (jsonResponse.indexOf(tag) !== -1) {
    const directiveJson = JSON.parse(jsonResponse);
    const directive: IDirective | undefined = directiveJson["directive"];
    return directive;
  } else {
    return undefined;
  }
}

/**
 * Extract identifier from a directive.
 * @param directive
 */
export function getDirectiveIdentifier(directive: IDirective): string {
  Logger.verbose(`Calling method: AVSClientUtil.getDirectiveIdentifier`);
  const directiveHeader: IHeader = directive.header;
  const namespace: string = directiveHeader.namespace.trim();
  const name: string = directiveHeader.name.trim();
  return namespace + "." + name;
}

/**
 * Get the text response from the caption field of SpeechSynthesizer.Speak directive.
 * @param captionContent
 */
export async function parseCaptionContent(captionContent: string): Promise<string> {
  Logger.verbose(`Calling method: AVSClientUtil.parseCaptionContent`);
  let captionResult = "";
  const parsedContent = await webvtt.parse(captionContent, {strict: false});
  if (parsedContent.cues !== null) {
    captionResult = parsedContent.cues.map((cue) => cue.text).join(" ");
  }
  return captionResult;
}

/**
 * Convert the text utterance to speech to call AVS recognize API.
 * @param utterance
 */
export async function generateRequestSpeech(utterance: string, context: vscode.ExtensionContext): Promise<string> {
  Logger.verbose(`Calling method: AVSClientUtil.generateRequestSpeech`);
  let audioPath;
  const skillFolder = getSkillFolderInWs(context);
  if (skillFolder) {
    const skillSimulatePath = path.join(skillFolder.fsPath, SKILL_FOLDER.HIDDEN_ASK_FOLDER, SKILL_FOLDER.SIMULATION_INPUTS);
    makeDirSync(skillSimulatePath);

    const platform = os.platform();
    if (platform === "darwin") {
      audioPath = await generateRequestSpeechMacOS(utterance, skillSimulatePath);
    } else if (platform === "win32") {
      audioPath = await generateRequestSpeechWindows(utterance, skillSimulatePath);
    }
    return audioPath;
  }
  throw logAskError("Workspace does not contain a valid skill project");
}

export async function generateRequestSpeechMacOS(utterance: string, skillSimulatePath: string): Promise<string> {
  Logger.verbose(`Calling method: AVSClientUtil.generateRequestSpeechMacOS`);
  const filePath = path.join(skillSimulatePath, "simulatorSpeechRequest.wav");
  return new Promise((resolve, reject) => {
    say.export(`${utterance}`, "Alex", 0.75, filePath, (err) => {
      if (err) {
        reject(err);
      }
      resolve(filePath);
    });
  });
}

export function generateRequestSpeechWindows(utterance: string, skillSimulatePath: string) {
  Logger.verbose(`Calling method: AVSClientUtil.generateRequestSpeechWindows`);
  const filePath = path.join(skillSimulatePath, "simulatorSpeechRequest.wav");
  return new Promise((resolve, reject) => {
    say.export(`${utterance}`, "Microsoft David Desktop", 0.75, filePath, (err) => {
      if (err) {
        reject(err);
      }
      resolve(filePath);
    });
  });
}

export function convertSpeechFormat(speechPath: string) {
  const audioTmp = fs.readFileSync(speechPath);
  const wav = new WaveFile(audioTmp);
  wav.toBitDepth("16");
  wav.toSampleRate(16000);
  fs.writeFileSync(speechPath, wav.toBuffer());
}
