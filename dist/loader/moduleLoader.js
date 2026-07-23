import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
const MODULE_EXTENSION_PATTERN = /\.(?:[cm]?[jt]s)$/u;
const DECLARATION_FILE_PATTERN = /\.d\.(?:[cm]?ts)$/u;
function removeModuleExtension(fileName) {
    return fileName.replace(MODULE_EXTENSION_PATTERN, "");
}
function isModuleFile(fileName, allowedPrivateFileStems) {
    if (!MODULE_EXTENSION_PATTERN.test(fileName)) {
        return false;
    }
    if (DECLARATION_FILE_PATTERN.test(fileName)) {
        return false;
    }
    if (fileName.startsWith(".")) {
        return false;
    }
    const fileStem = removeModuleExtension(fileName);
    if (fileStem.startsWith("_") && !allowedPrivateFileStems.has(fileStem)) {
        return false;
    }
    return true;
}
async function collectModuleFiles(directory, recursive, allowedPrivateFileStems) {
    const files = [];
    async function visit(currentDirectory) {
        const entries = await fs.readdir(currentDirectory, {
            withFileTypes: true,
        });
        for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
            if (entry.name.startsWith(".")) {
                continue;
            }
            const entryPath = path.join(currentDirectory, entry.name);
            if (entry.isDirectory()) {
                if (recursive) {
                    await visit(entryPath);
                }
                continue;
            }
            if (entry.isFile() &&
                isModuleFile(entry.name, allowedPrivateFileStems)) {
                files.push(entryPath);
            }
        }
    }
    await visit(directory);
    return files;
}
/**
 * Scans a directory and imports supported JavaScript and TypeScript modules.
 *
 * Files are discovered in deterministic lexical order. Declaration files,
 * hidden files, and private underscore-prefixed files are excluded.
 */
export async function loadModules(config) {
    const logger = config.logger ?? console;
    const response = {
        successful: [],
        failed: [],
    };
    const rootDirectory = path.resolve(config.directory);
    const allowedPrivateFileStems = new Set(config.allowedPrivateFileStems ?? []);
    let moduleFiles;
    try {
        moduleFiles = await collectModuleFiles(rootDirectory, config.recursive ?? true, allowedPrivateFileStems);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to read directory: ${rootDirectory}`, errorMessage);
        throw new Error(`Directory read failure: ${errorMessage}`);
    }
    for (const filePath of moduleFiles) {
        const relativePath = path.relative(rootDirectory, filePath);
        try {
            const moduleExports = await import(pathToFileURL(filePath).href);
            const fileName = path.basename(filePath);
            const directoryName = path.dirname(relativePath);
            const directorySegments = directoryName === "."
                ? []
                : directoryName.split(path.sep).filter(Boolean);
            response.successful.push({
                filePath,
                relativePath,
                fileName,
                fileStem: removeModuleExtension(fileName),
                directorySegments,
                moduleExports,
            });
        }
        catch (importError) {
            const errorMessage = importError instanceof Error
                ? importError.message
                : String(importError);
            logger.error(`Failed to load module file at ${relativePath}`, errorMessage);
            response.failed.push({
                file: relativePath,
                error: errorMessage,
            });
        }
    }
    return response;
}
//# sourceMappingURL=moduleLoader.js.map