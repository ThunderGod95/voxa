import type { ChatInputCommandInteraction } from "discord.js";
import type { ArgumentParseResult, ArgumentSchema, ParsedArguments } from "./types";
/**
 * Validates and maps a Discord interaction payload against the provided schema.
 *
 * @param schema - The ArgumentSchema structure for the command.
 * @param interaction - The ChatInputCommandInteraction from Discord.
 * @returns A result object containing the mapped arguments or an error.
 */
export declare function parseInteractionArguments<Schema extends ArgumentSchema>(schema: Schema, interaction: ChatInputCommandInteraction): Promise<ArgumentParseResult<ParsedArguments<Schema>>>;
//# sourceMappingURL=interactionParser.d.ts.map