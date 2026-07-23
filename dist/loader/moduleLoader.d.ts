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
    failed: {
        file: string;
        error: string;
    }[];
}
/**
 * Scans a command directory and imports supported modules safely.
 */
export declare function loadModules(config: ModuleLoaderConfig): Promise<ModuleLoaderResponse>;
//# sourceMappingURL=moduleLoader.d.ts.map