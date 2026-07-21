import type { TokenizeResult } from "./types";

/**
 * Parses a raw command string into individual argument tokens, respecting quotes and escapes.
 *
 * @param input - The raw string following the command name.
 * @returns A TokenizeResult containing the extracted tokens or a syntax error.
 */
export function tokenizeArguments(input: string): TokenizeResult {
    const tokens: string[] = [];

    let current = "";
    let quote: '"' | "'" | null = null;
    let escaped = false;
    let tokenStarted = false;

    for (const character of input) {
        if (escaped) {
            current += character;
            escaped = false;
            tokenStarted = true;
            continue;
        }

        if (character === "\\") {
            escaped = true;
            tokenStarted = true;
            continue;
        }

        if (quote) {
            if (character === quote) {
                quote = null;
            } else {
                current += character;
            }
            continue;
        }

        if (character === '"' || character === "'") {
            quote = character;
            tokenStarted = true;
            continue;
        }

        if (/\s/u.test(character)) {
            if (tokenStarted) {
                tokens.push(current);
                current = "";
                tokenStarted = false;
            }
            continue;
        }

        current += character;
        tokenStarted = true;
    }

    if (escaped) {
        current += "\\";
    }

    if (quote) {
        return {
            success: false,
            error: {
                code: "INVALID_SYNTAX",
                message: "An argument has an unterminated quote.",
            },
        };
    }

    if (tokenStarted) {
        tokens.push(current);
    }

    return {
        success: true,
        tokens,
    };
}
