import type { ChatInputCommandInteraction } from "discord.js";
import type { ArgumentParseResult, ArgumentSchema, ParsedArguments } from "./types";
/**
 * Validates and maps Discord interaction options onto a command schema.
 */
export declare function parseInteractionArguments<Schema extends ArgumentSchema>(schema: Schema, interaction: ChatInputCommandInteraction): Promise<ArgumentParseResult<ParsedArguments<Schema>>>;
//# sourceMappingURL=interactionParser.d.ts.map