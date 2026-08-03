import { Collection } from "discord.js";
import { validateCommandRoute } from "./validation";
/**
 * Creates a normalized, case-insensitive lookup key for a command path.
 *
 * @internal
 */
export function createRouteKey(path) {
    return path.map((segment) => segment.toLowerCase()).join(" ");
}
function getSegmentAliases(route, index) {
    if (index === route.path.length - 1) {
        return route.command.aliases ?? [];
    }
    return route.groups?.[index]?.aliases ?? [];
}
/**
 * Produces every canonical and aliased lookup key for a route prefix.
 *
 * @internal
 */
export function createRoutePrefixLookupKeys(route, segmentCount) {
    const variants = route.path
        .slice(0, segmentCount)
        .map((segment, index) => [segment, ...getSegmentAliases(route, index)]);
    let keys = [[]];
    for (const segmentVariants of variants) {
        keys = keys.flatMap((prefix) => segmentVariants.map((segment) => [...prefix, segment]));
    }
    return [...new Set(keys.map(createRouteKey))];
}
/**
 * Produces every canonical and aliased lookup key for a prefix route.
 *
 * For example, a route whose root and leaf both have one alias produces all
 * four combinations.
 *
 * @internal
 */
export function createRouteLookupKeys(route) {
    return createRoutePrefixLookupKeys(route, route.path.length);
}
/**
 * Produces every canonical and aliased parent lookup key for a message-default
 * command route.
 *
 * The command leaf and its aliases are intentionally omitted because invoking
 * a message default means that no explicit subcommand segment was supplied.
 *
 * @internal
 */
export function createMessageDefaultLookupKeys(route) {
    if (!route.command.messageDefault || route.path.length < 2) {
        return [];
    }
    return createRoutePrefixLookupKeys(route, route.path.length - 1);
}
/**
 * Stores canonical command routes, prefix-command alias lookups, and
 * message-default parent lookups.
 *
 * Registration is transactional: an invalid or conflicting route prevents the
 * entire batch from being applied.
 *
 * @internal
 */
export class CommandRouteRegistry {
    /**
     * Canonical routes keyed by their normalized path.
     */
    routes = new Collection();
    /**
     * Prefix-command lookup containing canonical routes, aliases, and
     * message-default parent paths.
     */
    commands = new Collection();
    routeLookup = new Collection();
    messageDefaultLookup = new Collection();
    /**
     * Registers a collection of routes as one atomic operation.
     *
     * @param routes - Routes to validate and register.
     *
     * @throws Error when a route is invalid or when a path, alias, or
     * message-default parent conflicts with another route.
     */
    register(routes) {
        const stagedCanonical = new Map();
        const stagedLookup = new Map();
        const stagedMessageDefaults = new Map();
        for (const route of routes) {
            validateCommandRoute(route);
            const canonicalKey = createRouteKey(route.path);
            if (this.routes.has(canonicalKey) ||
                stagedCanonical.has(canonicalKey)) {
                throw new Error(`Command route "${canonicalKey}" is already registered.`);
            }
            stagedCanonical.set(canonicalKey, route);
            for (const lookupKey of createRouteLookupKeys(route)) {
                const existing = stagedLookup.get(lookupKey) ??
                    this.routeLookup.get(lookupKey);
                if (existing &&
                    createRouteKey(existing.path) !== canonicalKey) {
                    throw new Error(`Command route or alias "${lookupKey}" is already ` +
                        `registered by "${existing.path.join(" ")}".`);
                }
                stagedLookup.set(lookupKey, route);
            }
            for (const lookupKey of createMessageDefaultLookupKeys(route)) {
                const existing = stagedMessageDefaults.get(lookupKey) ??
                    this.messageDefaultLookup.get(lookupKey);
                if (existing &&
                    createRouteKey(existing.path) !== canonicalKey) {
                    throw new Error(`Message-default route "${lookupKey}" is already ` +
                        `registered by "${existing.path.join(" ")}".`);
                }
                stagedMessageDefaults.set(lookupKey, route);
            }
        }
        /*
         * Prevent a real executable route from occupying a message-default
         * parent path. Without this check, the explicit route would always
         * shadow the default during longest-route resolution.
         */
        for (const [lookupKey, defaultRoute] of stagedMessageDefaults) {
            const explicitRoute = stagedLookup.get(lookupKey) ?? this.routeLookup.get(lookupKey);
            if (explicitRoute) {
                throw new Error(`Message-default parent "${lookupKey}" for ` +
                    `"${defaultRoute.path.join(" ")}" conflicts with ` +
                    `the executable route "${explicitRoute.path.join(" ")}".`);
            }
        }
        /*
         * Perform the inverse check for routes registered after an existing
         * message default.
         */
        for (const [lookupKey, explicitRoute] of stagedLookup) {
            const defaultRoute = this.messageDefaultLookup.get(lookupKey);
            if (defaultRoute) {
                throw new Error(`Command route or alias "${lookupKey}" for ` +
                    `"${explicitRoute.path.join(" ")}" conflicts with ` +
                    `the message-default route "${defaultRoute.path.join(" ")}".`);
            }
        }
        for (const [canonicalKey, route] of stagedCanonical) {
            this.routes.set(canonicalKey, route);
        }
        for (const [lookupKey, route] of stagedLookup) {
            this.routeLookup.set(lookupKey, route);
            this.commands.set(lookupKey, route.command);
        }
        for (const [lookupKey, route] of stagedMessageDefaults) {
            this.messageDefaultLookup.set(lookupKey, route);
            this.commands.set(lookupKey, route.command);
        }
    }
    /**
     * Resolves an exact canonical route.
     *
     * Slash interactions use canonical Discord names and therefore do not use
     * the alias or message-default lookups.
     *
     * @param path - Canonical route segments.
     */
    getCanonical(path) {
        return this.routes.get(createRouteKey(path)) ?? null;
    }
    /**
     * Resolves the longest matching prefix-command route.
     *
     * Explicit canonical and aliased routes are checked before message-default
     * parent routes. This guarantees that an explicitly supplied subcommand
     * always wins over a default subcommand.
     *
     * @param tokens - Tokenized prefix-command input.
     */
    resolveMessage(tokens) {
        const maximumRouteLength = Math.min(3, tokens.length);
        for (let length = maximumRouteLength; length >= 1; length--) {
            const route = this.routeLookup.get(createRouteKey(tokens.slice(0, length)));
            if (route) {
                return {
                    route,
                    consumedTokens: length,
                };
            }
        }
        const maximumParentLength = Math.min(2, tokens.length);
        for (let length = maximumParentLength; length >= 1; length--) {
            const route = this.messageDefaultLookup.get(createRouteKey(tokens.slice(0, length)));
            if (route) {
                return {
                    route,
                    consumedTokens: length,
                };
            }
        }
        return null;
    }
}
//# sourceMappingURL=route.js.map