'use strict';

import * as vscode from 'vscode';
import { EXTENSION_CONFIG } from "./configuration";

export interface ICommand {
    readonly command: string;
    readonly subCommand?: string;
    readonly commandParameters?: Map<string, any>;
}

export class CommandRunner {
    /**
     * Stores all the existing terminal instance that created by the plugin
     * @type {Map<string, vscode.Terminal>}
     */
    private static cachedTerminals: Map<string, vscode.Terminal> = new Map<string, vscode.Terminal>();

    /**
     * Run commands in the VS Code integrated terminal.
     * @param {ICommand} input
     * @param {string} terminalName defaults to EXTENSION_CONFIG.IntegratedTermianlName
     */
    public static runCommand(input: ICommand, terminalName: string = EXTENSION_CONFIG.INTEGRATED_TERMINAL_NAME): void {
        if (!input.command) {
            return;
        }
        const commandString = this.buildCommand(input);
        const terminal = this.getTerminal(terminalName);
        terminal.show();
        terminal.sendText(commandString);
    }

    /**
     * Generate a command string which can be ran in the terminal.
     * @param {ICommand} input
     * @return {string}
     */
    private static buildCommand(input: ICommand): string {
        const output: string[] = [];
        output.push('ask');
        output.push(input.command);
        if (input.subCommand) {
            output.push(input.subCommand);
        }
        if (input.commandParameters) {
            output.push(this.buildInputParameters(input.commandParameters));
        }
        return output.join(' ');
    }

    /**
     * Get a VS Code integrated terminal instance.
     *
     * It checks cachedTerminals first, if it's not there,
     * create a new one and put it in the cachedTerminals map as well.
     *
     * @param {string} terminalName
     * @return {vscode.Terminal}
     */
    private static getTerminal(terminalName: string): vscode.Terminal {
        if (this.cachedTerminals.has(terminalName)) {
            return <vscode.Terminal>this.cachedTerminals.get(terminalName);
        }

        const terminalOptions = <vscode.TerminalOptions> {
            name: terminalName,
            env: {
                ASK_DOWNSTREAM_CLIENT: 'vscode'
            }
        };
        const newTerminal = vscode.window.createTerminal(terminalOptions);
        this.cachedTerminals.set(terminalName, newTerminal);
        return newTerminal;
    }

    /**
     * Remove the terminal from the cachedTerminals map if the terminal has been closed/killed.
     * @param {vscode.Terminal} terminal
     */
    public static onDidCloseTerminal(terminal: vscode.Terminal): void {
        this.cachedTerminals.delete(terminal.name);
        terminal.dispose();
    }

    /**
     * Combine all the parameters for the command from commandParameters.
     * @param {Map<string, any>} commandParameters
     * @return {string}
     */
    private static buildInputParameters(commandParameters: Map<string, any>): string {
        let output: string[] = [];
        for (let entry of commandParameters.entries()) {
            if (typeof entry[1] === 'boolean') {
                if (entry[1]) {
                    // if value is true, it means the command need the flag
                    // if value is false, the flag will be skipped.
                    output.push(`--${entry[0]}`);
                }
                continue;
            }

            output.push(`--${entry[0]}`);
            if (!entry[1]) {
                continue;
            }
            output.push(`"${entry[1]}"`);
        }
        return output.join(' ');
    }
}    

