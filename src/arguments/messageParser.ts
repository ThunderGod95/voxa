import type { Message } from "discord.js";
import { getRoleFromInput, getUserFromInput } from "../resolvers";
import type {
    ArgumentParseResult,
    ArgumentSchema,
    CommandArgumentDefinition,
    ParsedArguments,
    ResolutionResult,
} from "./types";

/**
 * Resolves a single raw string token into its target type (User, Role, etc) via a Message context.
 */
async function resolveMessageValue(
    name: string,
    definition: CommandArgumentDefinition,
    input: string,
    message: Message,
): Promise<ResolutionResult<unknown>> {
    let rawValue: unknown = input;

    switch (definition.type) {
        case "user": {
            const user = await getUserFromInput(input, message);
            if (!user) {
                return {
                    success: false,
                    code: "ARGUMENT_NOT_FOUND",
                    message: `Could not find a user for \`${name}\`.`,
                };
            }
            rawValue = user;
            break;
        }

        case "member": {
            if (!message.guild) {
                return {
                    success: false,
                    code: "INVALID_ARGUMENT",
                    message: `\`${name}\` can only be used in a server.`,
                };
            }
            const user = await getUserFromInput(input, message);
            if (!user) {
                return {
                    success: false,
                    code: "ARGUMENT_NOT_FOUND",
                    message: `Could not find a member for \`${name}\`.`,
                };
            }
            const member = await message.guild.members
                .fetch(user.id)
                .catch(() => null);
            if (!member) {
                return {
                    success: false,
                    code: "ARGUMENT_NOT_FOUND",
                    message: "That user is not a member of this server.",
                };
            }
            rawValue = member;
            break;
        }

        case "role": {
            if (!message.guild) {
                return {
                    success: false,
                    code: "INVALID_ARGUMENT",
                    message: `\`${name}\` can only be used in a server.`,
                };
            }
            const role = getRoleFromInput(
                input,
                message.guild,
                definition.allowedRoleIds,
            );
            if (!role) {
                return {
                    success: false,
                    code: "ARGUMENT_NOT_FOUND",
                    message: `Could not find a role for \`${name}\`.`,
                };
            }
            rawValue = role;
            break;
        }
    }

    const validation = await definition._schema.safeParseAsync(rawValue);

    if (!validation.success) {
        return {
            success: false,
            code: "INVALID_ARGUMENT",
            message: `\`${name}\`: ${validation.error.issues[0]?.message ?? "Invalid argument."}`,
        };
    }

    return { success: true, value: validation.data };
}

/**
 * Parses and maps a sequence of tokenized string arguments against a defined schema.
 *
 * @param schema - The ArgumentSchema structure for the command.
 * @param message - The Discord Message that triggered the command.
 * @param tokens - An array of raw string tokens extracted from the message.
 * @returns A result object containing the validated, strongly-typed arguments or an error.
 */
export async function parseMessageArguments<Schema extends ArgumentSchema>(
    schema: Schema,
    message: Message,
    tokens: readonly string[],
): Promise<ArgumentParseResult<ParsedArguments<Schema>>> {
    const parsed: Record<string, unknown> = {};
    let tokenIndex = 0;

    for (const [name, definition] of Object.entries(schema)) {
        const input = definition.rest
            ? tokenIndex < tokens.length
                ? tokens.slice(tokenIndex).join(" ")
                : undefined
            : tokens[tokenIndex];

        if (definition.rest) {
            tokenIndex = tokens.length;
        } else if (input !== undefined) {
            tokenIndex++;
        }

        if (input === undefined) {
            if (definition.required) {
                return {
                    success: false,
                    error: {
                        code: "MISSING_ARGUMENT",
                        argument: name,
                        message: `Missing required argument: \`${name}\`.`,
                    },
                };
            }

            parsed[name] = null;
            continue;
        }

        const resolved = await resolveMessageValue(
            name,
            definition,
            input,
            message,
        );

        if (!resolved.success) {
            return {
                success: false,
                error: {
                    code: resolved.code,
                    argument: name,
                    message: resolved.message,
                },
            };
        }

        parsed[name] = resolved.value;
    }

    if (tokenIndex < tokens.length) {
        return {
            success: false,
            error: {
                code: "TOO_MANY_ARGUMENTS",
                message: "Too many arguments were provided.",
            },
        };
    }

    return {
        success: true,
        value: parsed as ParsedArguments<Schema>,
    };
}
