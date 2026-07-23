import type { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "discord.js";
import type { ArgumentSchema } from "./types";
/**
 * Mutates a SlashCommandBuilder by automatically appending options derived from an ArgumentSchema.
 *
 * @param builder - The Discord.js SlashCommandBuilder instance.
 * @param schema - The schema defining the command's arguments.
 */
export declare function addArgumentsToSlashCommand(builder: SlashCommandBuilder | SlashCommandSubcommandBuilder, schema: ArgumentSchema): void;
/**
 * Asserts the validity of an ArgumentSchema at boot-time.
 * Throws an Error if logical constraints (e.g., ordering, limits) are violated.
 *
 * @param commandName - The name of the command (used for error tracing).
 * @param schema - The schema to validate.
 */
export declare function validateArgumentSchema(commandName: string, schema: ArgumentSchema): void;
/**
 * Generates a human-readable usage string from an ArgumentSchema.
 * Example format: `<required_arg> [optional_arg] [rest_arg...]`
 *
 * @param schema - The schema to format.
 * @returns Formatted usage string.
 */
export declare function formatArgumentUsage(schema: ArgumentSchema): string;
//# sourceMappingURL=utils.d.ts.map