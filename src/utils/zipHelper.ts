import * as fs from "fs";
import * as path from "path";
import * as AdmZip from "adm-zip";
import { AskError, loggableAskError } from "../exceptions";
import { Logger } from "../logger";

export function unzipFile(zipLocation: string, destPath: string, overWriteFiles = true, deleteZipAfter = true): void {
    Logger.verbose(`Calling method: unzipFile, args: `, zipLocation, destPath, overWriteFiles, deleteZipAfter);
    const zip = new AdmZip(zipLocation);
    try {
        zip.extractAllTo(destPath, overWriteFiles);

        if (deleteZipAfter) {
            fs.unlinkSync(zipLocation);
        }
    } catch (unzipErr) {
        throw loggableAskError(`Unzip failed: ${unzipErr}`);
    }
}

export function createZipFile(sourceDir: string, zipFileDir): string {
    Logger.verbose(`Calling method: createZipFile, args: `, sourceDir, zipFileDir);
    try {
        fs.accessSync(sourceDir, fs.constants.W_OK);
        if (path.extname(zipFileDir) === ".zip") {
            throw new AskError(`The source file ${zipFileDir} has already been compressed. Skip the zipping`);
        }
        const zip = new AdmZip();
        zip.addLocalFolder(sourceDir);
        const zipFilePath = path.join(zipFileDir, "ask_tmp.zip");
        zip.writeZip(zipFilePath);
        return zipFilePath;
    } catch (error) {
        throw loggableAskError(`Create temp zip failed: ${error}`);
    }
}

export function zipDirectory(sourceDir: string, outDir: string): void {
    Logger.verbose(`Calling method: zipDirectory, args: `, sourceDir, outDir);
    try {
        const zip = new AdmZip();
        zip.addLocalFolder(sourceDir);
        const zipFilePath = path.join(outDir);
        zip.writeZip(zipFilePath);
    } catch (error) {
        throw loggableAskError(`Zip Directory failed: ${error}`);
    }
}
