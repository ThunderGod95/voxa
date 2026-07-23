import type { Client } from "discord.js";
import { EventManager, type EventManagerConfig } from "../events";
import { resolveEventModules } from "./eventResolver";
import { loadModules } from "./moduleLoader";

/**
 * Configuration for automatic Discord event loading.
 */
export interface EventLoaderConfig extends EventManagerConfig {
    /**
     * Discord.js client to which handlers are attached.
     */
    client: Client;

    /**
     * Directory containing event modules.
     */
    directory: string;

    /**
     * Whether nested event directories should be scanned.
     *
     * @defaultValue true
     */
    recursive?: boolean;
}

/**
 * Result of loading and attaching Discord event modules.
 */
export interface EventLoaderResult {
    /**
     * Manager that owns every attached event listener.
     */
    manager: EventManager;

    /**
     * Module discovery, validation, and attachment statistics.
     */
    diagnostics: {
        /**
         * Number of successfully attached handlers.
         */
        loadedCount: number;

        /**
         * Number of distinct Discord events represented by loaded handlers.
         */
        eventCount: number;

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
 * Discovers event modules and attaches their handlers to a Discord.js client.
 *
 * Modules are loaded recursively by default. Multiple modules may handle the
 * same Discord event.
 */
export async function loadEvents(
    config: EventLoaderConfig,
): Promise<EventLoaderResult> {
    const logger = config.logger ?? console;

    const manager = new EventManager(config.client, {
        logger,
        onError: config.onError,
    });

    const imported = await loadModules({
        directory: config.directory,
        recursive: config.recursive ?? true,
        logger,
    });

    const resolved = resolveEventModules(imported.successful);

    const failed = [...imported.failed, ...resolved.failed];

    for (const skipped of resolved.skipped) {
        logger.warn(`Skipped ${skipped.file}: ${skipped.reason}`);
    }

    for (const failure of resolved.failed) {
        logger.error(`Failed to resolve ${failure.file}: ${failure.error}`);
    }

    let loadedCount = 0;

    const loadedEventNames = new Set<string>();

    for (const handler of resolved.handlers) {
        try {
            manager.register(handler.definition, {
                source: handler.file,
            });

            loadedCount++;
            loadedEventNames.add(handler.definition.name);
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);

            logger.error(
                `Failed to attach event handler from ${handler.file}: ${errorMessage}`,
            );

            failed.push({
                file: handler.file,
                error: errorMessage,
            });
        }
    }

    return {
        manager,

        diagnostics: {
            loadedCount,
            eventCount: loadedEventNames.size,
            skippedCount: resolved.skipped.length,
            failedCount: failed.length,
            skipped: resolved.skipped,
            failed,
        },
    };
}
