import {
    type CommandHandlerConfig,
    CommandManager,
    createSlashCommandPayloads,
    type SlashCommandPayload,
} from "../manager";
import { resolveCommandModules } from "./commandResolver";
import { loadModules } from "./moduleLoader";

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

export async function loadCommands(
    config: CommandLoaderConfig,
): Promise<CommandLoaderResult> {
    const logger = config.logger ?? console;
    const manager = new CommandManager(config);

    const imported = await loadModules({
        directory: config.directory,
        recursive: config.recursive ?? true,
        logger,
    });

    const resolved = resolveCommandModules(imported.successful);
    const failed = [...imported.failed, ...resolved.failed];

    for (const skipped of resolved.skipped) {
        logger.warn(`Skipped ${skipped.file}: ${skipped.reason}`);
    }

    for (const failure of resolved.failed) {
        logger.error(`Failed to resolve ${failure.file}: ${failure.error}`);
    }

    manager.registerCommandRoutes(resolved.routes);

    const slashCommandPayloads = createSlashCommandPayloads(resolved.routes);

    const groupCount = new Set(
        resolved.routes.flatMap((route) =>
            route.path
                .slice(0, -1)
                .map((_, index) => route.path.slice(0, index + 1).join(" ")),
        ),
    ).size;

    return {
        manager,
        slashCommandPayloads,
        restPayloads: slashCommandPayloads,

        diagnostics: {
            loadedCount: resolved.routes.length,
            groupCount,
            skippedCount: resolved.skipped.length,
            failedCount: failed.length,
            skipped: resolved.skipped,
            failed,
        },
    };
}
