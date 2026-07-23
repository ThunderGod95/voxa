export interface CommandLogger {
    error(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    info?(message: string, ...args: unknown[]): void;
}
export declare const defaultCommandLogger: CommandLogger;
//# sourceMappingURL=logger.d.ts.map