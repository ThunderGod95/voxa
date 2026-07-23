import { type CommandHandlerConfig, CommandManager, type SlashCommandPayload } from "../manager";
export * from "./commandResolver";
export * from "./eventLoader";
export * from "./eventResolver";
export * from "./moduleLoader";
/**
 * Configuration for automatic command loading.
 */
export interface CommandLoaderConfig extends CommandHandlerConfig {
    directory: string;
    /**
     * Whether command directory resolution is recursive.
     *
     * @defaultValue true
     */
    recursive?: boolean;
}
/**
 * Result of loading command modules.
 */
export interface CommandLoaderResult {
    manager: CommandManager;
    /**
     * Slash-command manifest ready for Discord registration.
     */
    slashCommandPayloads: SlashCommandPayload[];
    /**
     * @deprecated Use `slashCommandPayloads` instead.
     */
    restPayloads: SlashCommandPayload[];
    diagnostics: {
        loadedCount: number;
        groupCount: number;
        skippedCount: number;
        failedCount: number;
        skipped: {
            file: string;
            reason: string;
        }[];
        failed: {
            file: string;
            error: string;
        }[];
    };
}
/**
 * Discovers command modules and registers their canonical routes.
 */
export declare function loadCommands(config: CommandLoaderConfig): Promise<CommandLoaderResult>;
//# sourceMappingURL=index.d.ts.map