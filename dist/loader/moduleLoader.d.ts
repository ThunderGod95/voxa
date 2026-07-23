import type { VoxaLogger } from "../logger";
/**
 * Configuration for filesystem module discovery.
 */
export interface ModuleLoaderConfig {
    /**
     * Root directory containing modules.
     */
    directory: string;
    /**
     * Whether nested directories should be scanned.
     *
     * @defaultValue true
     */
    recursive?: boolean;
    /**
     * Logger used for filesystem and module-import failures.
     */
    logger?: VoxaLogger;
    /**
     * Underscore-prefixed module stems that should remain loadable.
     *
     * Underscore-prefixed modules are private by default. Command loading uses
     * this option to allow its reserved `_group` metadata module.
     *
     * @example
     * ```ts
     * allowedPrivateFileStems: ["_group"]
     * ```
     */
    allowedPrivateFileStems?: readonly string[];
}
/**
 * Successfully imported filesystem module and its path metadata.
 */
export interface LoadResult {
    filePath: string;
    relativePath: string;
    fileName: string;
    fileStem: string;
    directorySegments: readonly string[];
    moduleExports: Record<string, unknown>;
}
/**
 * Result of importing every discoverable module in a directory.
 */
export interface ModuleLoaderResponse {
    successful: LoadResult[];
    failed: {
        file: string;
        error: string;
    }[];
}
/**
 * Scans a directory and imports supported JavaScript and TypeScript modules.
 *
 * Files are discovered in deterministic lexical order. Declaration files,
 * hidden files, and private underscore-prefixed files are excluded.
 */
export declare function loadModules(config: ModuleLoaderConfig): Promise<ModuleLoaderResponse>;
//# sourceMappingURL=moduleLoader.d.ts.map