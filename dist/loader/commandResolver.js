import path from "node:path";
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isCommandDefinition(value) {
    if (!isRecord(value)) {
        return false;
    }
    return ((value.name === undefined || typeof value.name === "string") &&
        typeof value.description === "string" &&
        typeof value.execute === "function");
}
function isCommandGroup(value) {
    if (!isRecord(value)) {
        return false;
    }
    return typeof value.description === "string";
}
function getCommandFromModule(moduleExports) {
    const candidate = moduleExports.default ?? moduleExports.command;
    return isCommandDefinition(candidate) ? candidate : null;
}
function getGroupFromModule(moduleExports) {
    const candidate = moduleExports.default ??
        moduleExports.group ??
        moduleExports.commandGroup;
    return isCommandGroup(candidate) ? candidate : null;
}
function groupKey(segments) {
    return segments.join("/").toLowerCase();
}
function defaultGroupDescription(name) {
    const readableName = name.replace(/[-_]+/gu, " ");
    return `${readableName[0]?.toUpperCase() ?? ""}${readableName.slice(1)} commands.`;
}
function createDefaultGroup(name) {
    return {
        description: defaultGroupDescription(name),
    };
}
function toCommandPath(segments) {
    switch (segments.length) {
        case 1:
            return [segments[0] ?? ""];
        case 2:
            return [segments[0] ?? "", segments[1] ?? ""];
        case 3:
            return [segments[0] ?? "", segments[1] ?? "", segments[2] ?? ""];
        default:
            return null;
    }
}
/**
 * Converts imported filesystem modules into canonical command routes.
 */
export function resolveCommandModules(modules) {
    const response = {
        routes: [],
        skipped: [],
        failed: [],
    };
    const groups = new Map();
    const commandModules = [];
    for (const loadedModule of modules) {
        if (loadedModule.fileStem !== "_group") {
            commandModules.push(loadedModule);
            continue;
        }
        if (loadedModule.directorySegments.length === 0) {
            response.failed.push({
                file: loadedModule.relativePath,
                error: "A root-level _group module does not describe a command directory.",
            });
            continue;
        }
        const group = getGroupFromModule(loadedModule.moduleExports);
        if (!group) {
            response.failed.push({
                file: loadedModule.relativePath,
                error: 'Module must export a valid command group as default, "group", or "commandGroup".',
            });
            continue;
        }
        const key = groupKey(loadedModule.directorySegments);
        if (groups.has(key)) {
            response.failed.push({
                file: loadedModule.relativePath,
                error: `Duplicate metadata for command group "${key}".`,
            });
            continue;
        }
        groups.set(key, group);
    }
    for (const loadedModule of commandModules) {
        const definition = getCommandFromModule(loadedModule.moduleExports);
        if (!definition) {
            response.skipped.push({
                file: loadedModule.relativePath,
                reason: 'Module does not export a valid command as default or as "command".',
            });
            continue;
        }
        const name = definition.name ?? loadedModule.fileStem;
        const command = {
            ...definition,
            name,
        };
        const routeSegments = [...loadedModule.directorySegments, name];
        const commandPath = toCommandPath(routeSegments);
        if (!commandPath) {
            response.failed.push({
                file: loadedModule.relativePath,
                error: `Command route "${routeSegments.join(" ")}" is too deep. ` +
                    "Discord supports only command, command/subcommand, " +
                    "or command/group/subcommand.",
            });
            continue;
        }
        const routeGroups = loadedModule.directorySegments.map((segment, index) => {
            const key = groupKey(loadedModule.directorySegments.slice(0, index + 1));
            return groups.get(key) ?? createDefaultGroup(segment);
        });
        response.routes.push({
            path: commandPath,
            command,
            groups: routeGroups,
        });
    }
    response.routes.sort((left, right) => left.path.join(" ").localeCompare(right.path.join(" ")));
    for (const [key] of groups) {
        const hasCommand = response.routes.some((route) => {
            const parentPath = route.path.slice(0, -1).join("/").toLowerCase();
            return parentPath === key || parentPath.startsWith(`${key}/`);
        });
        if (!hasCommand) {
            response.skipped.push({
                file: path.join(...key.split("/"), "_group.ts"),
                reason: "Command group contains no command modules.",
            });
        }
    }
    return response;
}
//# sourceMappingURL=commandResolver.js.map