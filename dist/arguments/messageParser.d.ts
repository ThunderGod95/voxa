import type { Message } from "discord.js";
import type { ArgumentParseResult, ArgumentSchema, ParsedArguments } from "./types";
/**
 * Parses and resolves message-command arguments.
 *
 * CLI grammar is handled by messageSyntax.ts. This layer only maps raw
 * positionals/options onto their semantic Voxa value definitions.
 */
export declare function parseMessageArguments<Schema extends ArgumentSchema>(schema: Schema, message: Message, tokens: readonly string[]): Promise<ArgumentParseResult<ParsedArguments<Schema>>>;
//# sourceMappingURL=messageParser.d.ts.map