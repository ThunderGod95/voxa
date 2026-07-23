import type { Client } from "discord.js";
import { defaultVoxaLogger, type VoxaLogger } from "../logger";
import type {
    AnyEventDefinition,
    ClientEventName,
    EventDefinition,
} from "./event";

type RuntimeEventListener = (...args: unknown[]) => void;

type RuntimeEventExecutor = (...args: unknown[]) => Promise<void> | void;

/**
 * Runtime event-emitter boundary used after event modules have been loaded
 * dynamically.
 *
 * Static typing is preserved while event files are authored through
 * `defineEvent`. Arguments become unknown only after heterogeneous handlers
 * enter the runtime registry.
 *
 * @internal
 */
interface ClientEventEmitterBridge {
    on(eventName: ClientEventName, listener: RuntimeEventListener): void;
    once(eventName: ClientEventName, listener: RuntimeEventListener): void;
    off(eventName: ClientEventName, listener: RuntimeEventListener): void;
}

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
export type EventErrorHandler = (
    error: unknown,
    context: EventErrorContext,
) => Promise<void> | void;

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

class ManagedEventRegistration implements EventRegistration {
    private isActive = true;

    public constructor(
        public readonly eventName: ClientEventName,
        public readonly once: boolean,
        public readonly source: string | undefined,
        private readonly detach: () => void,
        private readonly onDispose: (
            registration: ManagedEventRegistration,
        ) => void,
    ) {}

    public get active(): boolean {
        return this.isActive;
    }

    public dispose(): void {
        if (!this.isActive) {
            return;
        }

        this.isActive = false;
        this.detach();
        this.onDispose(this);
    }
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
export class EventManager {
    private readonly emitter: ClientEventEmitterBridge;

    private readonly logger: VoxaLogger;

    private readonly onError: EventErrorHandler | undefined;

    private readonly registrations = new Set<ManagedEventRegistration>();

    private disposed = false;

    /**
     * Creates an event manager for a Discord.js client.
     *
     * @param client - Client to which event handlers are attached.
     * @param config - Logging and error-handling configuration.
     */
    public constructor(
        public readonly client: Client,
        config: EventManagerConfig = {},
    ) {
        this.emitter = client as unknown as ClientEventEmitterBridge;
        this.logger = config.logger ?? defaultVoxaLogger;
        this.onError = config.onError;
    }

    /**
     * Number of listeners currently owned by this manager.
     */
    public get registrationCount(): number {
        return this.registrations.size;
    }

    /**
     * Whether this manager has been disposed.
     */
    public get isDisposed(): boolean {
        return this.disposed;
    }

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
    public register<Name extends ClientEventName>(
        definition: EventDefinition<Name>,
        options: EventRegistrationOptions = {},
    ): EventRegistration {
        if (this.disposed) {
            throw new Error(
                "Cannot register an event handler after EventManager disposal.",
            );
        }

        const once = definition.once ?? false;
        const source = options.source;

        /*
         * Dynamic event registries necessarily erase the relationship between
         * an event name and its argument tuple. That relationship remains
         * enforced at the defineEvent boundary.
         */
        const execute = definition.execute as unknown as RuntimeEventExecutor;

        let registration: ManagedEventRegistration | undefined;

        const listener: RuntimeEventListener = (...args) => {
            if (once) {
                registration?.dispose();
            }

            /*
             * Starting from a resolved promise catches both synchronous throws
             * and asynchronous rejections without leaking an unhandled promise.
             */
            void Promise.resolve()
                .then(() => execute(...args))
                .catch((error: unknown) => {
                    this.reportHandlerError(error, definition, source);
                });
        };

        registration = new ManagedEventRegistration(
            definition.name,
            once,
            source,
            () => {
                this.emitter.off(definition.name, listener);
            },
            (disposedRegistration) => {
                this.registrations.delete(disposedRegistration);
            },
        );

        try {
            if (once) {
                this.emitter.once(definition.name, listener);
            } else {
                this.emitter.on(definition.name, listener);
            }
        } catch (error) {
            registration.dispose();
            throw error;
        }

        this.registrations.add(registration);

        return registration;
    }

    /**
     * Returns the number of active registrations.
     *
     * When `eventName` is provided, only handlers for that event are counted.
     */
    public listenerCount(eventName?: ClientEventName): number {
        if (eventName === undefined) {
            return this.registrations.size;
        }

        let count = 0;

        for (const registration of this.registrations) {
            if (registration.eventName === eventName) {
                count++;
            }
        }

        return count;
    }

    /**
     * Detaches every event listener owned by this manager.
     *
     * The manager cannot be reused after disposal. Repeated calls have no
     * effect.
     */
    public dispose(): void {
        if (this.disposed) {
            return;
        }

        this.disposed = true;

        for (const registration of [...this.registrations]) {
            registration.dispose();
        }
    }

    private reportHandlerError<Name extends ClientEventName>(
        error: unknown,
        definition: EventDefinition<Name>,
        source: string | undefined,
    ): void {
        const sourceDescription = source ? ` from ${source}` : "";

        this.logger.error(
            `Error executing Discord event handler "${definition.name}"${sourceDescription}:`,
            error,
        );

        if (!this.onError) {
            return;
        }

        void Promise.resolve()
            .then(() =>
                this.onError?.(error, {
                    definition: definition as AnyEventDefinition,
                    source,
                }),
            )
            .catch((handlerError: unknown) => {
                this.logger.error(
                    `The event error handler failed for "${definition.name}":`,
                    handlerError,
                );
            });
    }
}
