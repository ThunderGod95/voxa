import { defaultVoxaLogger } from "../logger";
class ManagedEventRegistration {
    eventName;
    once;
    source;
    detach;
    onDispose;
    isActive = true;
    constructor(eventName, once, source, detach, onDispose) {
        this.eventName = eventName;
        this.once = once;
        this.source = source;
        this.detach = detach;
        this.onDispose = onDispose;
    }
    get active() {
        return this.isActive;
    }
    dispose() {
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
    client;
    emitter;
    logger;
    onError;
    registrations = new Set();
    disposed = false;
    /**
     * Creates an event manager for a Discord.js client.
     *
     * @param client - Client to which event handlers are attached.
     * @param config - Logging and error-handling configuration.
     */
    constructor(client, config = {}) {
        this.client = client;
        this.emitter = client;
        this.logger = config.logger ?? defaultVoxaLogger;
        this.onError = config.onError;
    }
    /**
     * Number of listeners currently owned by this manager.
     */
    get registrationCount() {
        return this.registrations.size;
    }
    /**
     * Whether this manager has been disposed.
     */
    get isDisposed() {
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
    register(definition, options = {}) {
        if (this.disposed) {
            throw new Error("Cannot register an event handler after EventManager disposal.");
        }
        const once = definition.once ?? false;
        const source = options.source;
        /*
         * Dynamic event registries necessarily erase the relationship between
         * an event name and its argument tuple. That relationship remains
         * enforced at the defineEvent boundary.
         */
        const execute = definition.execute;
        let registration;
        const listener = (...args) => {
            if (once) {
                registration?.dispose();
            }
            /*
             * Starting from a resolved promise catches both synchronous throws
             * and asynchronous rejections without leaking an unhandled promise.
             */
            void Promise.resolve()
                .then(() => execute(...args))
                .catch((error) => {
                this.reportHandlerError(error, definition, source);
            });
        };
        registration = new ManagedEventRegistration(definition.name, once, source, () => {
            this.emitter.off(definition.name, listener);
        }, (disposedRegistration) => {
            this.registrations.delete(disposedRegistration);
        });
        try {
            if (once) {
                this.emitter.once(definition.name, listener);
            }
            else {
                this.emitter.on(definition.name, listener);
            }
        }
        catch (error) {
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
    listenerCount(eventName) {
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
    dispose() {
        if (this.disposed) {
            return;
        }
        this.disposed = true;
        for (const registration of [...this.registrations]) {
            registration.dispose();
        }
    }
    reportHandlerError(error, definition, source) {
        const sourceDescription = source ? ` from ${source}` : "";
        this.logger.error(`Error executing Discord event handler "${definition.name}"${sourceDescription}:`, error);
        if (!this.onError) {
            return;
        }
        void Promise.resolve()
            .then(() => this.onError?.(error, {
            definition: definition,
            source,
        }))
            .catch((handlerError) => {
            this.logger.error(`The event error handler failed for "${definition.name}":`, handlerError);
        });
    }
}
//# sourceMappingURL=eventManager.js.map