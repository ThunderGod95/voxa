import { distance } from "fastest-levenshtein";
import { getEffectiveCommandAccess } from "../manager/access";
import { createRouteKey, createRouteLookupKeys, createRoutePrefixLookupKeys, } from "../manager/route";
function normalizeLookup(value) {
    return value.trim().replace(/^\/+/, "").replace(/\s+/gu, " ").toLowerCase();
}
function compareTargets(left, right) {
    return createRouteKey(left.path).localeCompare(createRouteKey(right.path));
}
function createTargetId(kind, path) {
    return `${kind === "command" ? "c" : "g"}|${createRouteKey(path)}`;
}
function startsWithPath(candidate, prefix) {
    return prefix.every((segment, index) => candidate[index] === segment);
}
function deduplicateByPath(targets, preferredKind) {
    const unique = new Map();
    for (const target of targets) {
        const key = createRouteKey(target.path);
        const existing = unique.get(key);
        if (!existing || target.kind === preferredKind) {
            unique.set(key, target);
        }
    }
    return [...unique.values()].sort(compareTargets);
}
/**
 * Immutable, user-aware help index built from the manager's live route registry.
 *
 * @internal
 */
export class HelpCatalogView {
    targets;
    byId;
    commandLookup;
    groupLookup;
    constructor(targets, byId, commandLookup, groupLookup) {
        this.targets = targets;
        this.byId = byId;
        this.commandLookup = commandLookup;
        this.groupLookup = groupLookup;
    }
    getRootTargets() {
        return deduplicateByPath(this.targets.filter((target) => target.path.length === 1), "group");
    }
    getChildren(group) {
        const depth = group.path.length + 1;
        return deduplicateByPath(this.targets.filter((target) => target.path.length === depth &&
            startsWithPath(target.path, group.path)), "group");
    }
    resolve(input) {
        const key = normalizeLookup(input);
        return key
            ? (this.commandLookup.get(key) ?? this.groupLookup.get(key) ?? null)
            : null;
    }
    resolveId(id) {
        return this.byId.get(id) ?? null;
    }
    autocomplete(input, limit = 25) {
        const query = normalizeLookup(input);
        const candidates = deduplicateByPath(this.targets, "command");
        return candidates
            .map((target) => {
            const path = createRouteKey(target.path);
            const searchable = `${path} ${target.description}`.toLowerCase();
            let score = path.split(" ").length * 100 + path.length;
            if (query) {
                if (path === query) {
                    score = 0;
                }
                else if (path.startsWith(query)) {
                    score = 10 + path.length - query.length;
                }
                else if (searchable.includes(query)) {
                    score = 100 + searchable.indexOf(query);
                }
                else {
                    score = 1_000 + distance(query, path);
                }
            }
            return { path, score };
        })
            .sort((left, right) => left.score - right.score ||
            left.path.localeCompare(right.path))
            .slice(0, limit)
            .map(({ path }) => path);
    }
    suggest(input, limit = 3) {
        const query = normalizeLookup(input);
        return deduplicateByPath(this.targets, "command")
            .map((target) => ({
            target,
            score: distance(query, createRouteKey(target.path)),
        }))
            .sort((left, right) => left.score - right.score ||
            compareTargets(left.target, right.target))
            .slice(0, limit)
            .map(({ target }) => target);
    }
}
/**
 * Creates user-specific help views over the manager's current routes.
 *
 * @internal
 */
export class HelpCatalog {
    source;
    constructor(source) {
        this.source = source;
    }
    createView(userId) {
        const routes = this.source
            .getRoutes()
            .filter((route) => !getEffectiveCommandAccess(route).devOnly ||
            this.source.isDeveloper(userId))
            .sort((left, right) => createRouteKey(left.path).localeCompare(createRouteKey(right.path)));
        const commands = [];
        const commandLookup = new Map();
        const mutableGroups = new Map();
        for (const route of routes) {
            const command = {
                kind: "command",
                id: createTargetId("command", route.path),
                path: route.path,
                description: route.command.description,
                route,
            };
            commands.push(command);
            for (const lookupKey of createRouteLookupKeys(route)) {
                commandLookup.set(lookupKey, command);
            }
            for (let depth = 1; depth < route.path.length; depth++) {
                const path = route.path.slice(0, depth);
                const key = createRouteKey(path);
                const metadata = route.groups?.[depth - 1];
                const group = mutableGroups.get(key) ?? {
                    path,
                    description: metadata?.description ??
                        `${path.at(-1) ?? "Command"} commands.`,
                    routes: [],
                    lookupKeys: new Set(),
                };
                group.routes.push(route);
                for (const lookupKey of createRoutePrefixLookupKeys(route, depth)) {
                    group.lookupKeys.add(lookupKey);
                }
                mutableGroups.set(key, group);
            }
        }
        const groups = [];
        const groupLookup = new Map();
        for (const group of mutableGroups.values()) {
            const target = {
                kind: "group",
                id: createTargetId("group", group.path),
                path: group.path,
                description: group.description,
                routes: group.routes,
            };
            groups.push(target);
            for (const lookupKey of group.lookupKeys) {
                groupLookup.set(lookupKey, target);
            }
        }
        const targets = [...commands, ...groups].sort(compareTargets);
        const byId = new Map(targets.map((target) => [target.id, target]));
        return new HelpCatalogView(targets, byId, commandLookup, groupLookup);
    }
}
//# sourceMappingURL=catalog.js.map