import { EventManager } from "../events";
import { resolveEventModules } from "./eventResolver";
import { loadModules } from "./moduleLoader";
/**
 * Discovers event modules and attaches their handlers to a Discord.js client.
 *
 * Modules are loaded recursively by default. Multiple modules may handle the
 * same Discord event.
 */
export async function loadEvents(config) {
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
    const loadedEventNames = new Set();
    for (const handler of resolved.handlers) {
        try {
            manager.register(handler.definition, {
                source: handler.file,
            });
            loadedCount++;
            loadedEventNames.add(handler.definition.name);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Failed to attach event handler from ${handler.file}: ${errorMessage}`);
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
//# sourceMappingURL=eventLoader.js.map