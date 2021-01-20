import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { homedir } from "os";
import { execSync, ExecSyncOptions } from "child_process";

import { API as GitApi, GitExtension } from "../@types/git";
import { Logger, LogLevel } from "../logger";
import { AskError } from "../exceptions";
import { SYSTEM_ASK_FOLDER } from "../constants";

export class GitInTerminalHelper {
    private folderPath: string;
    private logLevel: LogLevel;

    constructor(folderPath: string, logLevel: LogLevel) {
        this.folderPath = folderPath;
        this.logLevel = logLevel;
    }

    init(): void {
        const commands = [`git init "${this.folderPath}" --quiet`];
        const options = {
            showOutput: this.logLevel === LogLevel.verbose,
            showStdErr: true,
            showCommand: this.logLevel === LogLevel.verbose,
        };
        this._execCommands(commands, options);
    }

    configureCredentialHelper(repoUrl: string, profile: string, skillId: string): void {
        const credentialHelperPath = path.join(
            homedir(),
            SYSTEM_ASK_FOLDER.HIDDEN_ASK_FOLDER,
            SYSTEM_ASK_FOLDER.SCRIPTS_FOLDER.NAME,
            SYSTEM_ASK_FOLDER.SCRIPTS_FOLDER.GIT_CREDENTIAL_HELPER
        );
        const commands = [
            `git config --local credential.${repoUrl}.helper ""`,
            `git config --local --add credential.${repoUrl}.helper "!'${credentialHelperPath}' ${profile} ${skillId}"`,
            `git config --local credential.${repoUrl}.UseHttpPath true`,
        ];
        const options = {
            showOutput: this.logLevel === LogLevel.verbose,
            showStdErr: true,
            showCommand: this.logLevel === LogLevel.verbose,
            workingDir: this.folderPath,
        };
        this._execCommands(commands, options);
    }

    addOrigin(repoUrl: string): void {
        const commands = [`git remote add origin ${repoUrl}`];
        const options = {
            showOutput: this.logLevel === LogLevel.verbose,
            showStdErr: true,
            showCommand: this.logLevel === LogLevel.verbose,
            workingDir: this.folderPath,
        };
        this._execCommands(commands, options);
    }

    fetchAll(): void {
        const commands = [`git fetch --all --quiet`];
        const options = {
            showOutput: this.logLevel === LogLevel.verbose,
            showStdErr: true,
            showCommand: this.logLevel === LogLevel.verbose,
            workingDir: this.folderPath,
        };
        this._execCommands(commands, options);
    }

    checkoutBranch(branch: string): void {
        const commands = [`git checkout ${branch} --quiet'}`];
        const options = {
            showOutput: this.logLevel === LogLevel.verbose,
            showStdErr: true,
            showCommand: this.logLevel === LogLevel.verbose,
            workingDir: this.folderPath,
        };
        this._execCommands(commands, options);
    }

    version(): string {
        const command = `git --version`;
        const options = {
            showStdErr: true,
            showCommand: this.logLevel === LogLevel.verbose,
        };
        try {
            return this._execChildProcessSync(command, options).toString();
        } catch (error) {
            Logger.error(`${error}`);
            throw error;
        }
    }

    clone(cloneUrl: string, branch: string, folderName: string): void {
        const command = `git clone --branch ${branch} ${cloneUrl} "${folderName}"  --quiet`;
        const options = {
            showStdErr: true,
            showCommand: this.logLevel === LogLevel.verbose,
        };
        this._execChildProcessSync(command, options).toString();
    }

    static addFilesToIgnore(targetPath: string, fileNames: string[]): void {
        Logger.verbose(`Calling method: addFilesToIgnore, args: `, targetPath, fileNames);
        const gitignorePath = path.join(targetPath, ".gitignore");
        if (!fs.existsSync(gitignorePath)) {
            fs.writeFileSync(gitignorePath, `${fileNames.join("\n")}`, {
                mode: 0o600,
            });
        } else {
            const gitignoreFile = fs.readFileSync(gitignorePath).toString();
            fileNames.forEach(file => {
                if (!gitignoreFile.includes(file)) {
                    fs.appendFileSync(gitignorePath, `\n${file}`);
                }
            });
        }
    }

    private _execCommands(commands: string[], options: any): void {
        for (const command of commands) {
            try {
                this._execChildProcessSync(command, options);
            } catch (ex) {
                Logger.error(`${ex}`);
                throw new AskError(`${ex}`);
            }
        }
    }

    private _execChildProcessSync(command: string, options: any): Buffer {
        const { showOutput, showStdErr, showCommand, workingDir } = options;
        const execOptions: ExecSyncOptions = {
            stdio: [null, showOutput === true ? 1 : null, showStdErr === true ? 2 : null],
            windowsHide: this.logLevel === LogLevel.verbose,
        };
        if (workingDir !== undefined) {
            execOptions.cwd = options.workingDir;
        }
        if (showCommand === true) {
            Logger.verbose(`Executing git command : ${command}`);
        }
        return execSync(command, execOptions);
    }
}

export async function getOrInstantiateGitApi(context: vscode.ExtensionContext): Promise<GitApi | undefined> {
    Logger.verbose(`Calling method: getOrInstantiateGitApi`);
    // Getting the vscode `git` extension, as suggested here :
    // https://github.com/microsoft/vscode/tree/master/extensions/git
    const vscodeExtension = vscode.extensions.getExtension("vscode.git") as vscode.Extension<GitExtension>;
    if (vscodeExtension !== undefined) {
        const gitExtension = vscodeExtension.isActive ? vscodeExtension.exports : await vscodeExtension.activate();

        return gitExtension.getAPI(1);
    }
    return undefined;
}

export function isGitInstalled(): boolean {
    Logger.verbose(`Calling method: isGitInstalled`);
    const gitHelper = new GitInTerminalHelper("", Logger.logLevel);
    try {
        gitHelper.version();
        return true;
    } catch (error) {
        return false;
    }
}
