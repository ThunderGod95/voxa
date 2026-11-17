import { getSlashValueDefinition } from "./value";
/**
 * Resolves one Discord slash-command option according to its scalar value
 * definition.
 */
async function resolveInteractionValue(name, definition, interaction) {
    let rawValue = null;
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
            if (!user) {
                break;
            }
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
            break;
        }
        case "role": {
            const role = interaction.options.getRole(name);
            if (!role) {
                break;
            }
            if (!interaction.guild) {
                return {
                    success: false,
                    code: "INVALID_ARGUMENT",
                    message: `\`${name}\` can only be used in a server.`,
                };
            }
            if (definition.allowedRoleIds !== undefined &&
                !definition.allowedRoleIds.includes(role.id)) {
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
            break;
        }
    }
    if (rawValue === null) {
        return {
            success: true,
            value: null,
        };
    }
    const validation = await definition._schema.safeParseAsync(rawValue);
    if (!validation.success) {
        return {
            success: false,
            code: "INVALID_ARGUMENT",
            message: `\`${name}\`: ` +
                (validation.error.issues[0]?.message ?? "Invalid argument."),
        };
    }
    return {
        success: true,
        value: validation.data,
    };
}
/**
 * Validates and maps Discord interaction options onto a command schema.
 */
export async function parseInteractionArguments(schema, interaction) {
    const parsed = {};
    for (const [name, definition] of Object.entries(schema)) {
        const slashValue = getSlashValueDefinition(definition.value);
        const resolved = await resolveInteractionValue(name, slashValue, interaction);
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
        if (resolved.value === null) {
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
        parsed[name] = resolved.value;
    }
    return {
        success: true,
        value: parsed,
    };
}
//# sourceMappingURL=interactionParser.js.map