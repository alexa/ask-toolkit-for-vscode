/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import {window, ExtensionContext, OutputChannel} from "vscode";

import {EXTENSION_DISPLAY_NAME} from "./constants";

export enum LogLevel {
  error = "error",
  info = "info",
  debug = "debug",
  verbose = "verbose",
  off = "off",
}

export class Logger {
  private static _logLevel: LogLevel = LogLevel.info;
  private static outputChannel: OutputChannel | undefined;
  private static context: ExtensionContext;

  static configure(context: ExtensionContext, logLevel: LogLevel): void {
    this.context = context;
    this.logLevel = logLevel;
  }

  private static checkOrInitializeOutputChannel(): void {
    if (this.logLevel === LogLevel.off) {
      if (this.outputChannel) {
        this.outputChannel.dispose();
        this.outputChannel = undefined;
      }
    } else {
      this.outputChannel = this.outputChannel || window.createOutputChannel(EXTENSION_DISPLAY_NAME);
    }
  }

  static get logLevel(): LogLevel {
    return this._logLevel;
  }

  static set logLevel(value: LogLevel) {
    this._logLevel = value;
    this.checkOrInitializeOutputChannel();
  }

  private static writeToOutput(logLevel: LogLevel, message: string, ...params: any[]): void {
    const now = new Date().toISOString().replace(/T/, " ");
    if (this.outputChannel && this.logLevel !== LogLevel.off) {
      this.outputChannel.appendLine(`[${logLevel} - ${now}] ${message} ${params.length > 0 ? JSON.stringify(params) : ""}`);
    }
  }

  static error(message: string | Error, ...params: any[]): void {
    if (this.logLevel === LogLevel.off) {
      return;
    }

    let stack = "";
    if (message instanceof Error) {
      stack = message.stack ?? "";
    }

    if (this.outputChannel) {
      this.writeToOutput(LogLevel.error, `${message}`, ...params);
      this.outputChannel.appendLine(stack);
    }
  }

  static info(message: string, ...params: any[]): void {
    if (this.logLevel === LogLevel.off || this.logLevel === LogLevel.error) {
      return;
    }

    if (this.outputChannel) {
      this.writeToOutput(LogLevel.info, `${message}`, ...params);
    }
  }

  static debug(message: string, ...params: any[]): void {
    if ([LogLevel.off, LogLevel.error, LogLevel.info].includes(this.logLevel)) {
      return;
    }

    if (this.outputChannel) {
      this.writeToOutput(LogLevel.debug, `${message}`, ...params);
    }
  }

  static verbose(message: string, ...params: any[]): void {
    if (this.logLevel === LogLevel.off || this.logLevel !== LogLevel.verbose) {
      return;
    }

    if (this.outputChannel) {
      this.writeToOutput(LogLevel.verbose, `${message}`, ...params);
    }
  }

  static log(logLevel: LogLevel, message: string, ...params: any[]): void {
    switch (this.logLevel) {
      case LogLevel.off:
        return;
      case LogLevel.verbose:
        this.writeToOutput(logLevel, `${message}`, ...params);
        return;
      case LogLevel.debug:
        if ([LogLevel.debug, LogLevel.error, LogLevel.info].includes(logLevel)) {
          this.writeToOutput(logLevel, `${message}`, ...params);
        }
        return;
      case LogLevel.info:
        if ([LogLevel.error, LogLevel.info].includes(logLevel)) {
          this.writeToOutput(logLevel, `${message}`, ...params);
        }
        return;
      case LogLevel.error:
        if (logLevel === this.logLevel) {
          this.writeToOutput(logLevel, `${message}`, ...params);
        }
        return;
    }
  }
}
