import type { Message } from "discord.js";
import type { ArgumentParseResult, ArgumentSchema, ParsedArguments } from "./types";
/**
 * Parses and maps a sequence of tokenized string arguments against a defined schema.
 *
 * @param schema - The ArgumentSchema structure for the command.
 * @param message - The Discord Message that triggered the command.
 * @param tokens - An array of raw string tokens extracted from the message.
 * @returns A result object containing the validated, strongly-typed arguments or an error.
 */
export declare function parseMessageArguments<Schema extends ArgumentSchema>(schema: Schema, message: Message, tokens: readonly string[]): Promise<ArgumentParseResult<ParsedArguments<Schema>>>;
//# sourceMappingURL=messageParser.d.ts.map