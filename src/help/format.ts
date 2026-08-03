import { type PermissionResolvable, PermissionsBitField } from "discord.js";
import {
    type ArgumentChoiceValue,
    type ArgumentSchema,
    type ArgumentValueDefinition,
    type CommandArgumentDefinition,
    describeValueDefinition,
    formatArgumentUsage,
    getMessageOptionKind,
    resolveArgumentChoices,
    type ScalarValueDefinition,
} from "../arguments";
import {
    getEffectiveCommandAccess,
    isSlashRouteEnabled,
} from "../manager/access";
import type { CommandRoute } from "../manager/route";

const MAX_DISPLAYED_CHOICES = 5;
const MAX_INLINE_VALUE_LENGTH = 40;

export function escapeInlineCode(value: string): string {
    return value.replaceAll("`", "ˋ");
}

function truncateInlineValue(value: string): string {
    if (value.length <= MAX_INLINE_VALUE_LENGTH) {
        return value;
    }

    return `${value.slice(0, MAX_INLINE_VALUE_LENGTH - 1)}…`;
}

export function formatCommandPath(path: readonly string[]): string {
    return path.join(" ");
}

export function formatTargetLabel(path: readonly string[]): string {
    return `/${formatCommandPath(path)}`;
}

export function formatMessageUsage(
    route: CommandRoute,
    prefix: string,
): string {
    const usage = formatArgumentUsage(route.command.arguments ?? {});
    const command = `${prefix}${formatCommandPath(route.path)}`;

    return usage ? `${command} ${usage}` : command;
}

export function formatMessageDefaultUsage(
    route: CommandRoute,
    prefix: string,
): string | null {
    if (!route.command.messageDefault || route.path.length < 2) {
        return null;
    }

    const usage = formatArgumentUsage(route.command.arguments ?? {});
    const command = `${prefix}${formatCommandPath(route.path.slice(0, -1))}`;

    return usage ? `${command} ${usage}` : command;
}

export function formatSlashUsage(route: CommandRoute): string | null {
    if (!isSlashRouteEnabled(route)) {
        return null;
    }

    const schema = route.command.arguments ?? {};
    const argumentsUsage = Object.entries(schema)
        .map(([name, definition]) =>
            definition.required ? `<${name}>` : `[${name}]`,
        )
        .join(" ");

    const command = `/${formatCommandPath(route.path)}`;

    return argumentsUsage ? `${command} ${argumentsUsage}` : command;
}

function formatChoiceValues(definition: ScalarValueDefinition): string | null {
    if (
        (definition.type !== "string" &&
            definition.type !== "integer" &&
            definition.type !== "number") ||
        definition.choices === undefined
    ) {
        return null;
    }

    const choices = resolveArgumentChoices(
        definition.choices as
            | readonly ArgumentChoiceValue[]
            | Readonly<Record<string, ArgumentChoiceValue>>,
    );

    const visible = choices.slice(0, MAX_DISPLAYED_CHOICES).map((choice) => {
        const name = truncateInlineValue(choice.name);
        const value = truncateInlineValue(String(choice.value));

        return name === value
            ? `\`${escapeInlineCode(value)}\``
            : `\`${escapeInlineCode(name)}\` → ` +
                  `\`${escapeInlineCode(value)}\``;
    });

    const remaining = choices.length - visible.length;

    return [visible.join(", "), remaining > 0 ? `and ${remaining} more` : null]
        .filter((part): part is string => part !== null && part.length > 0)
        .join(" ");
}

function formatScalarConstraints(definition: ScalarValueDefinition): string[] {
    const constraints: string[] = [];

    switch (definition.type) {
        case "string":
            if (definition.minLength !== undefined) {
                constraints.push(`minimum ${definition.minLength} characters`);
            }

            if (definition.maxLength !== undefined) {
                constraints.push(`maximum ${definition.maxLength} characters`);
            }

            if (definition.aliases !== undefined) {
                const aliases = Object.entries(definition.aliases)
                    .slice(0, MAX_DISPLAYED_CHOICES)
                    .map(
                        ([alias, value]) =>
                            `\`${escapeInlineCode(
                                truncateInlineValue(alias),
                            )}\`→\`${escapeInlineCode(truncateInlineValue(value))}\``,
                    );

                constraints.push(`message aliases: ${aliases.join(", ")}`);
            }
            break;

        case "integer":
        case "number":
            if (definition.min !== undefined) {
                constraints.push(`minimum ${definition.min}`);
            }

            if (definition.max !== undefined) {
                constraints.push(`maximum ${definition.max}`);
            }
            break;

        case "role":
            if (definition.allowedRoleIds !== undefined) {
                constraints.push(
                    `${definition.allowedRoleIds.length} allowed role${
                        definition.allowedRoleIds.length === 1 ? "" : "s"
                    }`,
                );
            }
            break;

        case "url":
            if (definition.hostname !== undefined) {
                constraints.push("restricted hostname");
            }

            if (definition.protocol !== undefined) {
                constraints.push("restricted protocol");
            }

            if (definition.pattern !== undefined) {
                constraints.push("custom URL pattern");
            }
            break;

        case "time":
            if (definition.timezone !== undefined) {
                constraints.push(`timezone ${definition.timezone}`);
            }

            if (definition.forwardDate) {
                constraints.push("prefers future dates");
            }

            if (definition.strict) {
                constraints.push("strict parsing");
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
        constraints.push(`choices: ${choices}`);
    }

    return constraints;
}

function formatValueConstraints(definition: ArgumentValueDefinition): string[] {
    if (definition.type !== "union") {
        return formatScalarConstraints(definition);
    }

    const constraints = definition.variants.flatMap(formatScalarConstraints);

    return [...new Set(constraints)];
}

function formatArgumentSyntax(
    name: string,
    definition: CommandArgumentDefinition,
): string {
    if (definition.placement === "positional") {
        return definition.rest ? `${name}…` : name;
    }

    const optionKind = getMessageOptionKind(definition.value);

    const canonical =
        optionKind === "boolean"
            ? `${name}:true|false · --${name} · --no-${name}`
            : `${name}:value · --${name} value`;

    const aliases = [
        definition.short
            ? `-${definition.short}${optionKind === "boolean" ? "" : " value"}`
            : null,
        ...definition.longAliases.map((alias) =>
            optionKind === "boolean"
                ? `${alias}:true|false · --${alias} · --no-${alias}`
                : `${alias}:value · --${alias} value`,
        ),
    ].filter((alias): alias is string => alias !== null);

    return aliases.length > 0
        ? `${canonical} · ${aliases.join(" · ")}`
        : canonical;
}

export function formatArgumentEntries(schema: ArgumentSchema): string[] {
    return Object.entries(schema).map(([name, definition]) => {
        const metadata = [
            definition.required ? "required" : "optional",
            definition.placement === "positional"
                ? "positional"
                : "named option",
            describeValueDefinition(definition.value),
            definition.autocomplete ? "autocomplete" : null,
            ...formatValueConstraints(definition.value),
        ].filter(
            (value): value is string => value !== null && value.length > 0,
        );

        return [
            `**\`${escapeInlineCode(name)}\`** — ` + definition.description,
            `- Syntax: \`${escapeInlineCode(
                formatArgumentSyntax(name, definition),
            )}\``,
            `- ${metadata.join(" · ")}`,
        ].join("\n");
    });
}

function formatPermissions(
    permissions: readonly PermissionResolvable[],
): string | null {
    if (permissions.length === 0) {
        return null;
    }

    const resolved = new PermissionsBitField(permissions).toArray();

    return resolved.map((permission) => `\`${permission}\``).join(", ");
}

export function formatAccess(route: CommandRoute): string {
    const access = getEffectiveCommandAccess(route);

    const availability = [
        isSlashRouteEnabled(route) ? "slash" : null,
        "message",
    ].filter((value): value is string => value !== null);

    const lines = [
        `**Available through:** ${availability.join(" and ")} commands`,
    ];

    if (access.guildOnly) {
        lines.push("**Context:** Server only");
    } else {
        lines.push("**Context:** Servers and direct messages");
    }

    if (access.devOnly) {
        lines.push("**Visibility:** Bot developers only");
    }

    const userPermissions = formatPermissions(access.userPermissions);

    if (userPermissions) {
        lines.push(`**User permissions:** ${userPermissions}`);
    }

    const botPermissions = formatPermissions(access.botPermissions);

    if (botPermissions) {
        lines.push(`**Bot permissions:** ${botPermissions}`);
    }

    return lines.join("\n");
}

export function formatAliases(route: CommandRoute): string | null {
    const parts: string[] = [];

    for (const [index, group] of (route.groups ?? []).entries()) {
        if (!group.aliases || group.aliases.length === 0) {
            continue;
        }

        parts.push(
            `**${route.path[index]}:** ${group.aliases
                .map((alias) => `\`${escapeInlineCode(alias)}\``)
                .join(", ")}`,
        );
    }

    if (route.command.aliases && route.command.aliases.length > 0) {
        parts.push(
            `**${route.command.name}:** ${route.command.aliases
                .map((alias) => `\`${escapeInlineCode(alias)}\``)
                .join(", ")}`,
        );
    }

    return parts.length > 0 ? parts.join("\n") : null;
}
