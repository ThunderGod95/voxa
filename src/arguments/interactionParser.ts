import type { ChatInputCommandInteraction } from "discord.js";
import type {
    ArgumentParseResult,
    ArgumentSchema,
    CommandArgumentDefinition,
    ParsedArguments,
    ResolutionResult,
} from "./types";

/**
 * Resolves interaction options from Discord's interaction payload based on the definition type.
 */
async function resolveInteractionValue(
    name: string,
    definition: CommandArgumentDefinition,
    interaction: ChatInputCommandInteraction,
): Promise<ResolutionResult<unknown>> {
    let rawValue: unknown = null;

    switch (definition.type) {
        case "string":
        case "timezone":
        case "time":
        case "url":
            rawValue = interaction.options.getString(name);
            break;
        case "integer":
            rawValue = interaction.options.getInteger(name);
            break;
        case "number":
            rawValue = interaction.options.getNumber(name);
            break;
        case "boolean":
            rawValue = interaction.options.getBoolean(name);
            break;
        case "user":
            rawValue = interaction.options.getUser(name);
            break;
        case "member": {
            const user = interaction.options.getUser(name);
            if (user) {
                if (!interaction.guild) {
                    return {
                        success: false,
                        code: "INVALID_ARGUMENT",
                        message: `\`${name}\` can only be used in a server.`,
                    };
                }
                const member = await interaction.guild.members
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
            }
            break;
        }
        case "role": {
            const role = interaction.options.getRole(name);
            if (role) {
                if (!interaction.guild) {
                    return {
                        success: false,
                        code: "INVALID_ARGUMENT",
                        message: `\`${name}\` can only be used in a server.`,
                    };
                }
                if (
                    definition.allowedRoleIds &&
                    !definition.allowedRoleIds.includes(role.id)
                ) {
                    return {
                        success: false,
                        code: "INVALID_ARGUMENT",
                        message: `The selected role is not allowed for \`${name}\`.`,
                    };
                }
                const fetchedRole = await interaction.guild.roles
                    .fetch(role.id)
                    .catch(() => null);
                if (!fetchedRole) {
                    return {
                        success: false,
                        code: "ARGUMENT_NOT_FOUND",
                        message: "Could not find the selected role.",
                    };
                }
                rawValue = fetchedRole;
            }
            break;
        }
    }

    if (rawValue === null) {
        return { success: true, value: null };
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
 * Validates and maps a Discord interaction payload against the provided schema.
 *
 * @param schema - The ArgumentSchema structure for the command.
 * @param interaction - The ChatInputCommandInteraction from Discord.
 * @returns A result object containing the mapped arguments or an error.
 */
export async function parseInteractionArguments<Schema extends ArgumentSchema>(
    schema: Schema,
    interaction: ChatInputCommandInteraction,
): Promise<ArgumentParseResult<ParsedArguments<Schema>>> {
    const parsed: Record<string, unknown> = {};

    for (const [name, definition] of Object.entries(schema)) {
        const resolved = await resolveInteractionValue(
            name,
            definition,
            interaction,
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

        if (resolved.value === null && definition.required) {
            return {
                success: false,
                error: {
                    code: "MISSING_ARGUMENT",
                    argument: name,
                    message: `Missing required argument: \`${name}\`.`,
                },
            };
        }

        parsed[name] = resolved.value;
    }

    return {
        success: true,
        value: parsed as ParsedArguments<Schema>,
    };
}
