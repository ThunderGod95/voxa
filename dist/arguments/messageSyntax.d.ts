import type { ArgumentParseResult, ArgumentSchema } from "./types";
export interface ParsedMessageSyntax {
    positionals: string[];
    options: Readonly<Record<string, string | boolean>>;
}
/**
 * Parses message-command grammar into raw named and positional values.
 *
 * Semantic conversion is intentionally performed later by messageParser.ts.
 */
export declare function parseMessageSyntax(schema: ArgumentSchema, tokens: readonly string[]): ArgumentParseResult<ParsedMessageSyntax>;
//# sourceMappingURL=messageSyntax.d.ts.map