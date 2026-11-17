import type { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "discord.js";
import type { ArgumentSchema } from "./types";
/**
 * Mutates a slash-command builder by appending arguments derived from a Voxa
 * schema.
 *
 * Required options are emitted before optional ones because Discord requires
 * that ordering. Message-command schema order is preserved independently.
 */
export declare function addArgumentsToSlashCommand(builder: SlashCommandBuilder | SlashCommandSubcommandBuilder, schema: ArgumentSchema): void;
/**
 * Validates an argument schema at boot time.
 */
export declare function validateArgumentSchema(commandName: string, schema: ArgumentSchema): void;
/**
 * Generates message-command usage text.
 *
 * Example:
 *
 * <user> --amount=<integer> [--reason=<string>] [--silent[=<boolean>]]
 */
export declare function formatArgumentUsage(schema: ArgumentSchema): string;
//# sourceMappingURL=utils.d.ts.map