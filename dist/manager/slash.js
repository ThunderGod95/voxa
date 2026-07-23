import { InteractionContextType, PermissionsBitField, SlashCommandBuilder, } from "discord.js";
import { addArgumentsToSlashCommand } from "../arguments";
import { getEffectiveCommandAccess, isSlashRouteEnabled } from "./access";
import { EMPTY_ARGUMENTS } from "./command";
import { createRouteKey } from "./route";
import { validateCommandRoute } from "./validation";
function isDirectSubcommandRoute(route) {
    return route.path.length === 2 && route.groups?.length === 1;
}
function isGroupedSubcommandRoute(route) {
    return route.path.length === 3 && route.groups?.length === 2;
}
function applyRootCommandSettings(builder, guildOnly, userPermissions) {
    if (guildOnly) {
        builder.setContexts(InteractionContextType.Guild);
    }
    if (userPermissions.length > 0) {
        builder.setDefaultMemberPermissions(new PermissionsBitField(userPermissions).bitfield);
    }
}
function addRouteArguments(builder, route) {
    addArgumentsToSlashCommand(builder, route.command.arguments ?? EMPTY_ARGUMENTS);
}
function createFlatSlashCommandBuilder(route) {
    const builder = new SlashCommandBuilder()
        .setName(route.command.name)
        .setDescription(route.command.description);
    const access = getEffectiveCommandAccess(route);
    applyRootCommandSettings(builder, access.guildOnly, access.userPermissions);
    addRouteArguments(builder, route);
    return builder;
}
function valueSignature(values) {
    return values.map(String).join("\u0000");
}
function assertConsistentGroupMetadata(routes, groupIndex) {
    const first = routes[0]?.groups?.[groupIndex];
    if (!first) {
        throw new Error("Missing command group metadata.");
    }
    for (const route of routes.slice(1)) {
        const candidate = route.groups?.[groupIndex];
        if (!candidate) {
            throw new Error(`Missing group metadata for route "${route.path.join(" ")}".`);
        }
        if (candidate.description !== first.description ||
            candidate.guildOnly !== first.guildOnly ||
            candidate.slash !== first.slash ||
            valueSignature(candidate.userPermissions ?? []) !==
                valueSignature(first.userPermissions ?? [])) {
            throw new Error("Inconsistent metadata for command group " +
                `"${route.path.slice(0, groupIndex + 1).join(" ")}".`);
        }
    }
    return first;
}
function createNestedSlashCommandBuilder(rootName, routes) {
    const rootGroup = assertConsistentGroupMetadata(routes, 0);
    const builder = new SlashCommandBuilder()
        .setName(rootName)
        .setDescription(rootGroup.description);
    const allGuildOnly = routes.every((route) => getEffectiveCommandAccess(route).guildOnly);
    applyRootCommandSettings(builder, rootGroup.guildOnly === true || allGuildOnly, rootGroup.userPermissions ?? []);
    const directSubcommands = routes
        .filter(isDirectSubcommandRoute)
        .sort((left, right) => createRouteKey(left.path).localeCompare(createRouteKey(right.path)));
    const groupedRoutes = routes.filter(isGroupedSubcommandRoute);
    const groupNames = new Set(groupedRoutes.map((route) => route.path[1]));
    for (const route of directSubcommands) {
        const subcommandName = route.path[1];
        if (groupNames.has(subcommandName)) {
            throw new Error(`"${rootName} ${subcommandName}" cannot be both ` +
                "a subcommand and a subcommand group.");
        }
    }
    if (directSubcommands.length + groupNames.size > 25) {
        throw new Error(`Slash command "${rootName}" cannot contain more ` +
            "than 25 subcommands and subcommand groups.");
    }
    for (const route of directSubcommands) {
        builder.addSubcommand((subcommand) => {
            subcommand
                .setName(route.path[1])
                .setDescription(route.command.description);
            addRouteArguments(subcommand, route);
            return subcommand;
        });
    }
    const groupedByName = new Map();
    for (const route of groupedRoutes) {
        const groupName = route.path[1];
        const existing = groupedByName.get(groupName) ?? [];
        existing.push(route);
        groupedByName.set(groupName, existing);
    }
    const sortedGroups = [...groupedByName.entries()].sort(([left], [right]) => left.localeCompare(right));
    for (const [groupName, groupRoutes] of sortedGroups) {
        if (groupRoutes.length > 25) {
            throw new Error("Slash subcommand group " +
                `"${rootName} ${groupName}" cannot contain ` +
                "more than 25 subcommands.");
        }
        const group = assertConsistentGroupMetadata(groupRoutes, 1);
        builder.addSubcommandGroup((subcommandGroup) => {
            subcommandGroup
                .setName(groupName)
                .setDescription(group.description);
            const sortedRoutes = [...groupRoutes].sort((left, right) => createRouteKey(left.path).localeCompare(createRouteKey(right.path)));
            for (const route of sortedRoutes) {
                subcommandGroup.addSubcommand((subcommand) => {
                    subcommand
                        .setName(route.path[2])
                        .setDescription(route.command.description);
                    addRouteArguments(subcommand, route);
                    return subcommand;
                });
            }
            return subcommandGroup;
        });
    }
    return builder;
}
/**
 * Creates Discord.js slash-command builders from canonical command routes.
 *
 * Routes sharing a root are combined into subcommands and subcommand groups.
 * Prefix-only routes whose effective `slash` setting is `false` are omitted.
 *
 * The returned builders are sorted by root-command name.
 *
 * @param routes - Canonical command routes to convert.
 *
 * @throws Error when the routes form a command structure that Discord cannot
 * represent, such as combining a directly executable root with subcommands.
 */
export function createSlashCommandBuilders(routes) {
    for (const route of routes) {
        validateCommandRoute(route);
    }
    const slashRoutes = routes.filter(isSlashRouteEnabled);
    const routesByRoot = new Map();
    for (const route of slashRoutes) {
        const root = route.path[0];
        const existing = routesByRoot.get(root) ?? [];
        existing.push(route);
        routesByRoot.set(root, existing);
    }
    const builders = [];
    const sortedRoots = [...routesByRoot.entries()].sort(([left], [right]) => left.localeCompare(right));
    for (const [root, rootRoutes] of sortedRoots) {
        const flatRoutes = rootRoutes.filter((route) => route.path.length === 1);
        const nestedRoutes = rootRoutes.filter((route) => route.path.length > 1);
        if (flatRoutes.length > 0 && nestedRoutes.length > 0) {
            throw new Error(`Slash command "${root}" cannot execute directly ` +
                "and also contain subcommands.");
        }
        if (flatRoutes.length > 1) {
            throw new Error(`Duplicate slash command route "${root}".`);
        }
        const flatRoute = flatRoutes[0];
        builders.push(flatRoute
            ? createFlatSlashCommandBuilder(flatRoute)
            : createNestedSlashCommandBuilder(root, nestedRoutes));
    }
    return builders;
}
/**
 * Creates a Discord.js slash-command builder for one flat command.
 *
 * This compatibility helper does not create subcommands. Use
 * {@link createSlashCommandBuilders} when working with command routes.
 *
 * @param command - Flat command to convert.
 */
export function createSlashCommandBuilder(command) {
    return createFlatSlashCommandBuilder({
        path: [command.name],
        command,
        groups: [],
    });
}
/**
 * Creates JSON-ready slash-command payloads from canonical command routes.
 *
 * This is the registration counterpart to {@link createSlashCommandBuilders}.
 * The returned payloads can be passed directly to `SlashCommandRegistrar`.
 */
export function createSlashCommandPayloads(routes) {
    return createSlashCommandBuilders(routes).map((builder) => builder.toJSON());
}
//# sourceMappingURL=slash.js.map