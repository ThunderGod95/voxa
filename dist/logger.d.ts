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
export declare const defaultVoxaLogger: VoxaLogger;
//# sourceMappingURL=logger.d.ts.map