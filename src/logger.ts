/**
 * Logging interface shared by Voxa subsystems.
 *
 * Custom loggers may forward messages to structured logging services,
 * monitoring systems, or the console.
 */
export interface VoxaLogger {
    error(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    info?(message: string, ...args: unknown[]): void;
}

/**
 * Default Voxa logger backed by the global console.
 */
export const defaultVoxaLogger: VoxaLogger = {
    error(message, ...args) {
        console.error(message, ...args);
    },

    warn(message, ...args) {
        console.warn(message, ...args);
    },

    info(message, ...args) {
        console.info(message, ...args);
    },
};
