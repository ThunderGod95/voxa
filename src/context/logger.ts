import { defaultVoxaLogger, type VoxaLogger } from "../logger";

/**
 * Logger used by the command subsystem.
 *
 * This remains as a command-specific alias for backward compatibility.
 */
export type CommandLogger = VoxaLogger;

/**
 * Default command logger backed by the shared Voxa logger.
 */
export const defaultCommandLogger: CommandLogger = defaultVoxaLogger;
