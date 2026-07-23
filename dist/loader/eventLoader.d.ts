import type { Client } from "discord.js";
import { EventManager, type EventManagerConfig } from "../events";
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
export declare function loadEvents(config: EventLoaderConfig): Promise<EventLoaderResult>;
//# sourceMappingURL=eventLoader.d.ts.map