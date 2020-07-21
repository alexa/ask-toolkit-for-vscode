import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

import { AbstractCommand, CommandContext } from '../../../runtime';
import { loggableAskError } from '../../../exceptions';
import { LOCAL_DEBUG, DEFAULT_ENCODING } from '../../../constants';
import { Logger } from '../../../logger';

export class DebugAdapterPathCommand extends AbstractCommand<string> {
    async execute(context: CommandContext, debugArgs: any): Promise<string> {
        Logger.debug(`Calling method: ${this.commandName}, args:`, debugArgs);
        const languageType: string = debugArgs.type;
        if (languageType === LOCAL_DEBUG.NODE_DEPENDENCIES.LANG_TYPE) {
            const URIs = await vscode.workspace.findFiles(LOCAL_DEBUG.NODE_DEPENDENCIES.DEP_REGEX);
            if (URIs.length === 0) {
                throw loggableAskError(LOCAL_DEBUG.NODE_DEPENDENCIES.DEP_INSTALL_MSG);
            }
            return URIs[0].fsPath;
        } else if (languageType === LOCAL_DEBUG.PYTHON_DEPENDENCIES.LANG_TYPE) {
            const pythonInterpreterPath: string = debugArgs.pythonPath;
            const sitePkgUint8Array: Uint8Array = child_process.execSync(
                LOCAL_DEBUG.PYTHON_DEPENDENCIES.SITE_PKGS_CHECK(pythonInterpreterPath));
            let sitePkgLocationsStr = new TextDecoder(DEFAULT_ENCODING).decode(sitePkgUint8Array);
            
            // Preprocessing the string to get site locations for searching
            // https://docs.python.org/3/library/site.html#site.getsitepackages gives an array of strings
            // eg: "['sitePkg-A', 'sitePkg-B']", and we need to preprocess to get each location
            sitePkgLocationsStr = sitePkgLocationsStr.replace('[', '').replace(']', '').trim();
            const sitePkgLocations = sitePkgLocationsStr.split(",");
            
            for (let sitePkgLocation of sitePkgLocations) {
                // Remove extra quotes and white spaces
                sitePkgLocation = sitePkgLocation.replace(/['"]+/g, '').trim();
                const localDebuggerPath = path.join(sitePkgLocation, LOCAL_DEBUG.PYTHON_DEPENDENCIES.DEP_PATH);
                if (fs.existsSync(localDebuggerPath)) {
                    return localDebuggerPath;
                }
            }
            throw loggableAskError(LOCAL_DEBUG.PYTHON_DEPENDENCIES.DEP_INSTALL_MSG);
        }
        throw loggableAskError(LOCAL_DEBUG.DEBUG_PATH_ERROR(languageType));
    }
    
    constructor() {
        super('ask.debugAdapterPath');
    }
}