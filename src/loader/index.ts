import type { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";
import { loadModules } from "@/loader/moduleLoader";
import {
    type AnyCommand,
    type CommandHandlerConfig,
    CommandManager,
    createSlashCommandBuilder,
} from "@/manager";

export interface CommandLoaderConfig extends CommandHandlerConfig {
    directory: string;
    recursive?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCommand(value: unknown): value is AnyCommand {
    if (!isRecord(value)) {
        return false;
    }

    return (
        typeof value.name === "string" &&
        typeof value.description === "string" &&
        typeof value.execute === "function"
    );
}

function getCommandFromModule(
    moduleExports: Record<string, unknown>,
): AnyCommand | null {
    const candidate = moduleExports.default ?? moduleExports.command;
    return isCommand(candidate) ? candidate : null;
}

export async function loadCommands(config: CommandLoaderConfig) {
    const logger = config.logger ?? console;
    const manager = new CommandManager(config);

    const restPayloads: RESTPostAPIApplicationCommandsJSONBody[] = [];

    const { successful, failed } = await loadModules({
        directory: config.directory,
        recursive: config.recursive,
        logger,
    });

    for (const { fileName, moduleExports } of successful) {
        const command = getCommandFromModule(moduleExports);

        if (!command) {
            logger.warn(
                `Skipped: Module at ${fileName} does not export a valid command as default or as "command".`,
            );
            continue;
        }

        manager.registerCommands([command]);

        if (command.slash !== false) {
            restPayloads.push(createSlashCommandBuilder(command).toJSON());
        }
    }

    return {
        manager,
        restPayloads,
        diagnostics: {
            loadedCount: successful.length,
            failedCount: failed.length,
            failed,
        },
    };
}
