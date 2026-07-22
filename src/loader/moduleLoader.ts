import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const MODULE_EXTENSION_PATTERN = /\.(?:[cm]?[jt]s)$/u;
const DECLARATION_FILE_PATTERN = /\.d\.(?:[cm]?ts)$/u;

export interface ModuleLoaderConfig {
    directory: string;
    recursive?: boolean;
    logger?: {
        error: (message: string, ...args: unknown[]) => void;
        warn: (message: string, ...args: unknown[]) => void;
    };
}

export interface LoadResult {
    filePath: string;
    relativePath: string;
    fileName: string;
    fileStem: string;
    directorySegments: readonly string[];
    moduleExports: Record<string, unknown>;
}

export interface ModuleLoaderResponse {
    successful: LoadResult[];
    failed: { file: string; error: string }[];
}

function isModuleFile(fileName: string): boolean {
    if (!MODULE_EXTENSION_PATTERN.test(fileName)) {
        return false;
    }

    if (DECLARATION_FILE_PATTERN.test(fileName)) {
        return false;
    }

    if (fileName.startsWith(".")) {
        return false;
    }

    /*
     * Underscore-prefixed files remain private, except for the reserved
     * directory metadata module.
     */
    if (
        fileName.startsWith("_") &&
        !/^_group\.(?:[cm]?[jt]s)$/u.test(fileName)
    ) {
        return false;
    }

    return true;
}

function removeModuleExtension(fileName: string): string {
    return fileName.replace(MODULE_EXTENSION_PATTERN, "");
}

async function collectModuleFiles(
    directory: string,
    recursive: boolean,
): Promise<string[]> {
    const files: string[] = [];

    async function visit(currentDirectory: string): Promise<void> {
        const entries = await fs.readdir(currentDirectory, {
            withFileTypes: true,
        });

        for (const entry of entries.sort((left, right) =>
            left.name.localeCompare(right.name),
        )) {
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

            if (entry.isFile() && isModuleFile(entry.name)) {
                files.push(entryPath);
            }
        }
    }

    await visit(directory);

    return files;
}

/**
 * Scans a command directory and imports supported modules safely.
 */
export async function loadModules(
    config: ModuleLoaderConfig,
): Promise<ModuleLoaderResponse> {
    const logger = config.logger ?? console;
    const response: ModuleLoaderResponse = {
        successful: [],
        failed: [],
    };

    const rootDirectory = path.resolve(config.directory);

    let moduleFiles: string[];

    try {
        moduleFiles = await collectModuleFiles(
            rootDirectory,
            config.recursive ?? true,
        );
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);

        logger.error(
            `Failed to read directory: ${rootDirectory}`,
            errorMessage,
        );

        throw new Error(`Directory read failure: ${errorMessage}`);
    }

    for (const filePath of moduleFiles) {
        const relativePath = path.relative(rootDirectory, filePath);

        try {
            const moduleExports: Record<string, unknown> = await import(
                pathToFileURL(filePath).href
            );

            const fileName = path.basename(filePath);
            const directoryName = path.dirname(relativePath);

            const directorySegments =
                directoryName === "."
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
        } catch (importError) {
            const errorMessage =
                importError instanceof Error
                    ? importError.message
                    : String(importError);

            logger.error(
                `Failed to load module file at ${relativePath}`,
                errorMessage,
            );

            response.failed.push({
                file: relativePath,
                error: errorMessage,
            });
        }
    }

    return response;
}
