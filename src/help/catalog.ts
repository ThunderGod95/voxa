import { distance } from "fastest-levenshtein";
import { getEffectiveCommandAccess } from "../manager/access";
import type { CommandGroup } from "../manager/command";
import {
    type CommandRoute,
    createRouteKey,
    createRouteLookupKeys,
    createRoutePrefixLookupKeys,
} from "../manager/route";

export interface HelpCommandTarget {
    kind: "command";
    id: string;
    path: readonly string[];
    description: string;
    route: CommandRoute;
}

export interface HelpGroupTarget {
    kind: "group";
    id: string;
    path: readonly string[];
    description: string;
    routes: readonly CommandRoute[];
}

export type HelpTarget = HelpCommandTarget | HelpGroupTarget;

export interface HelpCatalogSource {
    getRoutes(): readonly CommandRoute[];
    isDeveloper(userId: string): boolean;
}

interface MutableGroup {
    path: readonly string[];
    description: string;
    routes: CommandRoute[];
    lookupKeys: Set<string>;
}

function normalizeLookup(value: string): string {
    return value.trim().replace(/^\/+/, "").replace(/\s+/gu, " ").toLowerCase();
}

function compareTargets(left: HelpTarget, right: HelpTarget): number {
    return createRouteKey(left.path).localeCompare(createRouteKey(right.path));
}

function createTargetId(
    kind: HelpTarget["kind"],
    path: readonly string[],
): string {
    return `${kind === "command" ? "c" : "g"}|${createRouteKey(path)}`;
}

function startsWithPath(
    candidate: readonly string[],
    prefix: readonly string[],
): boolean {
    return prefix.every((segment, index) => candidate[index] === segment);
}

function deduplicateByPath(
    targets: readonly HelpTarget[],
    preferredKind: HelpTarget["kind"],
): HelpTarget[] {
    const unique = new Map<string, HelpTarget>();

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
    public constructor(
        private readonly targets: readonly HelpTarget[],
        private readonly byId: ReadonlyMap<string, HelpTarget>,
        private readonly commandLookup: ReadonlyMap<string, HelpCommandTarget>,
        private readonly groupLookup: ReadonlyMap<string, HelpGroupTarget>,
    ) {}

    public getRootTargets(): HelpTarget[] {
        return deduplicateByPath(
            this.targets.filter((target) => target.path.length === 1),
            "group",
        );
    }

    public getChildren(group: HelpGroupTarget): HelpTarget[] {
        const depth = group.path.length + 1;

        return deduplicateByPath(
            this.targets.filter(
                (target) =>
                    target.path.length === depth &&
                    startsWithPath(target.path, group.path),
            ),
            "group",
        );
    }

    public resolve(input: string): HelpTarget | null {
        const key = normalizeLookup(input);

        return key
            ? (this.commandLookup.get(key) ?? this.groupLookup.get(key) ?? null)
            : null;
    }

    public resolveId(id: string): HelpTarget | null {
        return this.byId.get(id) ?? null;
    }

    public autocomplete(input: string, limit = 25): readonly string[] {
        const query = normalizeLookup(input);
        const candidates = deduplicateByPath(this.targets, "command");

        return candidates
            .map((target) => {
                const path = createRouteKey(target.path);
                const searchable =
                    `${path} ${target.description}`.toLowerCase();

                let score = path.split(" ").length * 100 + path.length;

                if (query) {
                    if (path === query) {
                        score = 0;
                    } else if (path.startsWith(query)) {
                        score = 10 + path.length - query.length;
                    } else if (searchable.includes(query)) {
                        score = 100 + searchable.indexOf(query);
                    } else {
                        score = 1_000 + distance(query, path);
                    }
                }

                return { path, score };
            })
            .sort(
                (left, right) =>
                    left.score - right.score ||
                    left.path.localeCompare(right.path),
            )
            .slice(0, limit)
            .map(({ path }) => path);
    }

    public suggest(input: string, limit = 3): HelpTarget[] {
        const query = normalizeLookup(input);

        return deduplicateByPath(this.targets, "command")
            .map((target) => ({
                target,
                score: distance(query, createRouteKey(target.path)),
            }))
            .sort(
                (left, right) =>
                    left.score - right.score ||
                    compareTargets(left.target, right.target),
            )
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
    public constructor(private readonly source: HelpCatalogSource) {}

    public createView(userId: string): HelpCatalogView {
        const routes = this.source
            .getRoutes()
            .filter(
                (route) =>
                    !getEffectiveCommandAccess(route).devOnly ||
                    this.source.isDeveloper(userId),
            )
            .sort((left, right) =>
                createRouteKey(left.path).localeCompare(
                    createRouteKey(right.path),
                ),
            );

        const commands: HelpCommandTarget[] = [];
        const commandLookup = new Map<string, HelpCommandTarget>();
        const mutableGroups = new Map<string, MutableGroup>();

        for (const route of routes) {
            const command: HelpCommandTarget = {
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
                const metadata: CommandGroup | undefined =
                    route.groups?.[depth - 1];

                const group = mutableGroups.get(key) ?? {
                    path,
                    description:
                        metadata?.description ??
                        `${path.at(-1) ?? "Command"} commands.`,
                    routes: [],
                    lookupKeys: new Set<string>(),
                };

                group.routes.push(route);

                for (const lookupKey of createRoutePrefixLookupKeys(
                    route,
                    depth,
                )) {
                    group.lookupKeys.add(lookupKey);
                }

                mutableGroups.set(key, group);
            }
        }

        const groups: HelpGroupTarget[] = [];
        const groupLookup = new Map<string, HelpGroupTarget>();

        for (const group of mutableGroups.values()) {
            const target: HelpGroupTarget = {
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
