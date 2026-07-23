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
 * Produces every canonical and aliased lookup key for a prefix route.
 *
 * For example, a route whose root and leaf both have one alias produces all
 * four combinations.
 *
 * @internal
 */
export function createRouteLookupKeys(route) {
    const variants = route.path.map((segment, index) => [
        segment,
        ...getSegmentAliases(route, index),
    ]);
    let keys = [[]];
    for (const segmentVariants of variants) {
        keys = keys.flatMap((prefix) => segmentVariants.map((segment) => [...prefix, segment]));
    }
    return [...new Set(keys.map(createRouteKey))];
}
/**
 * Stores canonical command routes and prefix-command alias lookups.
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
     * Canonical routes and every prefix-alias combination.
     */
    commands = new Collection();
    routeLookup = new Collection();
    /**
     * Registers a collection of routes as one atomic operation.
     *
     * @param routes - Routes to validate and register.
     *
     * @throws Error when a route is invalid or when a path or alias conflicts
     * with another route.
     */
    register(routes) {
        const stagedCanonical = new Map();
        const stagedLookup = new Map();
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
        }
        for (const [canonicalKey, route] of stagedCanonical) {
            this.routes.set(canonicalKey, route);
        }
        for (const [lookupKey, route] of stagedLookup) {
            this.routeLookup.set(lookupKey, route);
            this.commands.set(lookupKey, route.command);
        }
    }
    /**
     * Resolves an exact canonical route.
     *
     * Slash interactions use canonical Discord names and therefore do not use
     * the alias lookup.
     *
     * @param path - Canonical route segments.
     */
    getCanonical(path) {
        return this.routes.get(createRouteKey(path)) ?? null;
    }
    /**
     * Resolves the longest matching prefix-command route.
     *
     * Longest-first matching prevents a subcommand segment from being mistaken
     * for the first argument of a shorter route.
     *
     * For example, `admin user info` is checked before `admin user` and
     * `admin`.
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
        return null;
    }
}
//# sourceMappingURL=route.js.map