export interface ParseNaturalTimeOptions {
    /** The instant relative expressions such as "tomorrow" are based on. */
    reference?: Date;
    /** Optional IANA timezone in which the input should be interpreted. */
    timezone?: string;
    /** Prefer future dates when an expression is otherwise ambiguous. */
    forwardDate?: boolean;
    /** Parse only formal expressions instead of casual natural language. */
    strict?: boolean;
}
/**
 * Parses a natural-language date/time expression into an absolute Date.
 *
 * Examples:
 * - tomorrow at 5pm
 * - next Friday
 * - in three hours
 * - July 30 at 14:00
 */
export declare function parseNaturalTime(input: string, options?: ParseNaturalTimeOptions): Date | null;
//# sourceMappingURL=timeParser.d.ts.map