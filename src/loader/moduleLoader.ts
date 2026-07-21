import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

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
    fileName: string;
    moduleExports: Record<string, unknown>;
}

export interface ModuleLoaderResponse {
    successful: LoadResult[];
    failed: { file: string; error: string }[];
}

/**
 * Scans a directory for valid source files and imports them safely.
 */
export async function loadModules(
    config: ModuleLoaderConfig,
): Promise<ModuleLoaderResponse> {
    const logger = config.logger ?? console;
    const response: ModuleLoaderResponse = { successful: [], failed: [] };

    try {
        const files = await fs.readdir(config.directory, {
            recursive: config.recursive,
        });

        const moduleFiles = files.filter((file) => {
            const baseName = path.basename(file);
            return (
                (baseName.endsWith(".ts") || baseName.endsWith(".js")) &&
                !baseName.endsWith(".d.ts") &&
                !baseName.startsWith("_") &&
                !baseName.startsWith(".")
            );
        });

        for (const file of moduleFiles) {
            const filePath = path.join(config.directory, file);

            try {
                const fileUrl = pathToFileURL(filePath).href;

                const moduleExports: Record<string, unknown> = await import(
                    fileUrl
                );

                response.successful.push({
                    filePath,
                    fileName: file,
                    moduleExports,
                });
            } catch (importError) {
                const errorMessage =
                    importError instanceof Error
                        ? importError.message
                        : String(importError);

                logger.error(
                    `Failed to load module file at ${file}`,
                    errorMessage,
                );
                response.failed.push({ file, error: errorMessage });
            }
        }
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        logger.error(
            `Failed to read directory: ${config.directory}`,
            errorMessage,
        );

        throw new Error(`Directory read failure: ${errorMessage}`);
    }

    return response;
}
