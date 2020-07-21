import * as fs from 'fs';
import * as AdmZip from 'adm-zip';
import { loggableAskError } from '../exceptions';
import { Logger } from '../logger';

export function unzipFile(
    zipLocation: string, destPath: string, overWriteFiles=true, deleteZipAfter=true): void {
    Logger.verbose(`Calling method: unzipFile, args: `, zipLocation, destPath, overWriteFiles, deleteZipAfter);
    const zip = new AdmZip(zipLocation);
    try {
        zip.extractAllTo(destPath, overWriteFiles);

        if(deleteZipAfter) {
            fs.unlinkSync(zipLocation);
        }
    } catch (unzipErr) {
        throw loggableAskError(`Unzip failed: ${unzipErr}`);
    }
}