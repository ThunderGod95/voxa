import { type CommandHandlerConfig, CommandManager, type SlashCommandPayload } from "../manager";
export * from "./commandResolver";
export * from "./moduleLoader";
export interface CommandLoaderConfig extends CommandHandlerConfig {
    directory: string;
    /** Directory command resolution is recursive by default. */
    recursive?: boolean;
}
export interface CommandLoaderResult {
    manager: CommandManager;
    /** Slash-command manifest ready for Discord registration. */
    slashCommandPayloads: SlashCommandPayload[];
    /** @deprecated Use `slashCommandPayloads` instead. */
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
export declare function loadCommands(config: CommandLoaderConfig): Promise<CommandLoaderResult>;
//# sourceMappingURL=index.d.ts.map