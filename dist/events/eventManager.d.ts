import type { Client } from "discord.js";
import { type VoxaLogger } from "../logger";
import type { AnyEventDefinition, ClientEventName, EventDefinition } from "./event";
/**
 * Information supplied when an event handler fails.
 */
export interface EventErrorContext {
    /**
     * Event definition whose execution failed.
     */
    definition: AnyEventDefinition;
    /**
     * Source module associated with the event handler, when known.
     */
    source?: string;
}
/**
 * Receives errors thrown or rejected by event handlers.
 */
export type EventErrorHandler = (error: unknown, context: EventErrorContext) => Promise<void> | void;
/**
 * Configuration accepted by {@link EventManager}.
 */
export interface EventManagerConfig {
    /**
     * Logger used for event execution and error-handler failures.
     */
    logger?: VoxaLogger;
    /**
     * Optional callback invoked after an event execution error is logged.
     *
     * Errors thrown by this callback are also caught and logged.
     */
    onError?: EventErrorHandler;
}
/**
 * Metadata supplied when registering an event handler.
 */
export interface EventRegistrationOptions {
    /**
     * Human-readable source of the handler.
     *
     * The event loader sets this to the module's relative path.
     */
    source?: string;
}
/**
 * Represents one event listener owned by an {@link EventManager}.
 */
export interface EventRegistration {
    /**
     * Discord.js event associated with this registration.
     */
    readonly eventName: ClientEventName;
    /**
     * Whether the handler is registered as a one-time listener.
     */
    readonly once: boolean;
    /**
     * Source module associated with the handler, when known.
     */
    readonly source?: string;
    /**
     * Whether the listener is still attached.
     */
    readonly active: boolean;
    /**
     * Detaches this listener.
     *
     * Repeated calls have no effect.
     */
    dispose(): void;
}
/**
 * Owns Discord client event registrations.
 *
 * The manager:
 *
 * - Supports multiple handlers for the same event.
 * - Supports persistent and one-time handlers.
 * - Catches synchronous and asynchronous execution errors.
 * - Detaches only listeners registered through this manager.
 * - Provides deterministic cleanup for tests, shutdown, and hot reloading.
 */
export declare class EventManager {
    readonly client: Client;
    private readonly emitter;
    private readonly logger;
    private readonly onError;
    private readonly registrations;
    private disposed;
    /**
     * Creates an event manager for a Discord.js client.
     *
     * @param client - Client to which event handlers are attached.
     * @param config - Logging and error-handling configuration.
     */
    constructor(client: Client, config?: EventManagerConfig);
    /**
     * Number of listeners currently owned by this manager.
     */
    get registrationCount(): number;
    /**
     * Whether this manager has been disposed.
     */
    get isDisposed(): boolean;
    /**
     * Attaches an event definition to the client.
     *
     * Registering multiple definitions with the same event name is supported.
     *
     * @param definition - Strongly typed event definition.
     * @param options - Optional registration metadata.
     *
     * @returns Registration that can detach this individual listener.
     *
     * @throws Error when the manager has already been disposed.
     */
    register<Name extends ClientEventName>(definition: EventDefinition<Name>, options?: EventRegistrationOptions): EventRegistration;
    /**
     * Returns the number of active registrations.
     *
     * When `eventName` is provided, only handlers for that event are counted.
     */
    listenerCount(eventName?: ClientEventName): number;
    /**
     * Detaches every event listener owned by this manager.
     *
     * The manager cannot be reused after disposal. Repeated calls have no
     * effect.
     */
    dispose(): void;
    private reportHandlerError;
}
//# sourceMappingURL=eventManager.d.ts.map