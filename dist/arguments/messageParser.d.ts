import { type Message } from "discord.js";
import type { ArgumentParseResult, ArgumentSchema, ParsedArguments } from "./types";
/**
 * Parses and resolves message-command arguments.
 */
export declare function parseMessageArguments<Schema extends ArgumentSchema>(schema: Schema, message: Message, input: string): Promise<ArgumentParseResult<ParsedArguments<Schema>>>;
//# sourceMappingURL=messageParser.d.ts.map