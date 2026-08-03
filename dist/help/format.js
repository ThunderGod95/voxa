import { inlineCode, PermissionsBitField, } from "discord.js";
import { describeValueDefinition, formatArgumentUsage, resolveArgumentChoices, } from "../arguments";
import { getEffectiveCommandAccess } from "../manager/access";
const MAX_DISPLAYED_CHOICES = 5;
const MAX_INLINE_VALUE_LENGTH = 40;
export function escapeInlineCode(value) {
    return value.replaceAll("`", "ˋ");
}
function truncateInlineValue(value) {
    if (value.length <= MAX_INLINE_VALUE_LENGTH) {
        return value;
    }
    return `${value.slice(0, MAX_INLINE_VALUE_LENGTH - 1)}…`;
}
export function formatCommandPath(path) {
    return path.join(" ");
}
export function formatTargetLabel(path) {
    return `${inlineCode(`/${formatCommandPath(path)}`)}`;
}
export function formatMessageUsage(route, prefix) {
    const usage = formatArgumentUsage(route.command.arguments ?? {});
    const command = `${prefix}${formatCommandPath(route.path)}`;
    return usage ? `${command} ${usage}` : command;
}
export function formatMessageDefaultUsage(route, prefix) {
    if (!route.command.messageDefault || route.path.length < 2) {
        return null;
    }
    const usage = formatArgumentUsage(route.command.arguments ?? {});
    const command = `${prefix}${formatCommandPath(route.path.slice(0, -1))}`;
    return usage ? `${command} ${usage}` : command;
}
function formatChoiceValues(definition) {
    if ((definition.type !== "string" &&
        definition.type !== "integer" &&
        definition.type !== "number") ||
        definition.choices === undefined) {
        return null;
    }
    const choices = resolveArgumentChoices(definition.choices);
    const visible = choices.slice(0, MAX_DISPLAYED_CHOICES).map((choice) => {
        const name = truncateInlineValue(choice.name);
        const value = truncateInlineValue(String(choice.value));
        return name === value
            ? `\`${escapeInlineCode(value)}\``
            : `\`${escapeInlineCode(name)}\` (\`${escapeInlineCode(value)}\`)`;
    });
    const remaining = choices.length - visible.length;
    return [visible.join(", "), remaining > 0 ? `(+${remaining} more)` : null]
        .filter((part) => part !== null && part.length > 0)
        .join(" ");
}
function formatScalarConstraints(definition) {
    const inline = [];
    const blocks = [];
    switch (definition.type) {
        case "string":
            if (definition.minLength !== undefined) {
                inline.push(`Min length: ${definition.minLength}`);
            }
            if (definition.maxLength !== undefined) {
                inline.push(`Max length: ${definition.maxLength}`);
            }
            if (definition.aliases !== undefined) {
                const aliases = Object.entries(definition.aliases)
                    .slice(0, MAX_DISPLAYED_CHOICES)
                    .map(([alias, value]) => `\`${escapeInlineCode(truncateInlineValue(alias))}\` (\`${escapeInlineCode(truncateInlineValue(value))}\`)`);
                blocks.push(`- **Aliases:** ${aliases.join(", ")}`);
            }
            break;
        case "integer":
        case "number":
            if (definition.min !== undefined) {
                inline.push(`Min: ${definition.min}`);
            }
            if (definition.max !== undefined) {
                inline.push(`Max: ${definition.max}`);
            }
            break;
        case "role":
            if (definition.allowedRoleIds !== undefined) {
                inline.push(`${definition.allowedRoleIds.length} allowed role${definition.allowedRoleIds.length === 1 ? "" : "s"}`);
            }
            break;
        case "url":
            if (definition.hostname !== undefined) {
                inline.push("Restricted hostname");
            }
            if (definition.protocol !== undefined) {
                inline.push("Restricted protocol");
            }
            if (definition.pattern !== undefined) {
                inline.push("Custom URL pattern");
            }
            break;
        case "time":
            if (definition.timezone !== undefined) {
                inline.push(`Timezone: ${definition.timezone}`);
            }
            if (definition.forwardDate) {
                inline.push("Prefers future dates");
            }
            if (definition.strict) {
                inline.push("Strict parsing");
            }
            break;
        case "boolean":
        case "member":
        case "timezone":
        case "user":
            break;
    }
    const choices = formatChoiceValues(definition);
    if (choices) {
        blocks.push(`- **Choices:** ${choices}`);
    }
    return { inline, blocks };
}
function formatValueConstraints(definition) {
    if (definition.type !== "union") {
        return formatScalarConstraints(definition);
    }
    const constraints = definition.variants.map(formatScalarConstraints);
    return {
        inline: [...new Set(constraints.flatMap((c) => c.inline))],
        blocks: [...new Set(constraints.flatMap((c) => c.blocks))],
    };
}
export function formatArgumentEntries(schema) {
    return Object.entries(schema).map(([name, definition]) => {
        let typeDescription = describeValueDefinition(definition.value);
        if (typeDescription.includes("|") && typeDescription.length > 25) {
            typeDescription = "Multiple options";
        }
        const formattedType = typeDescription.charAt(0).toUpperCase() + typeDescription.slice(1);
        const constraints = formatValueConstraints(definition.value);
        const metadata = [
            definition.required ? "**Required**" : "Optional",
            formattedType,
            definition.autocomplete ? "Supports autocomplete" : null,
            ...constraints.inline,
        ].filter((value) => value !== null && value.length > 0);
        const lines = [
            `**\`${escapeInlineCode(name)}\`** — ${definition.description}`,
            `- ${metadata.join(" • ")}`,
            ...constraints.blocks,
        ];
        return lines.join("\n");
    });
}
function formatPermissions(permissions) {
    if (permissions.length === 0) {
        return null;
    }
    const resolved = new PermissionsBitField(permissions).toArray();
    return resolved.map((permission) => `\`${permission}\``).join(", ");
}
export function formatAccess(route) {
    const access = getEffectiveCommandAccess(route);
    const lines = [];
    if (access.devOnly) {
        lines.push("**Visibility:** Bot developers only");
    }
    const userPermissions = formatPermissions(access.userPermissions);
    if (userPermissions) {
        lines.push(`**Required permissions:** ${userPermissions}`);
    }
    return lines.length > 0 ? `### Access\n\n${lines.join("\n")}` : null;
}
export function formatAliases(route) {
    const allAliases = [];
    for (const group of route.groups ?? []) {
        if (group.aliases && group.aliases.length > 0) {
            allAliases.push(...group.aliases.map((alias) => `\`${escapeInlineCode(alias)}\``));
        }
    }
    if (route.command.aliases && route.command.aliases.length > 0) {
        allAliases.push(...route.command.aliases.map((alias) => `\`${escapeInlineCode(alias)}\``));
    }
    return allAliases.length > 0
        ? `**Aliases:** ${allAliases.join(", ")}`
        : null;
}
//# sourceMappingURL=format.js.map