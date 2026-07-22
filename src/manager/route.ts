import { Collection } from "discord.js";
import type { AnyCommand, CommandGroup } from "./command";
import { validateCommandRoute } from "./validation";

/**
 * A canonical command path supported by Discord.
 *
 * The tuple represents one of these forms:
 *
 * - `[command]`
 * - `[command, subcommand]`
 * - `[command, subcommandGroup, subcommand]`
 */
export type CommandPath =
    | readonly [string]
    | readonly [string, string]
    | readonly [string, string, string];

/**
 * Associates a command with its canonical path and inherited group metadata.
 */
export interface CommandRoute {
    /**
     * Canonical route segments in root-to-leaf order.
     */
    path: CommandPath;

    /**
     * Command executed when this route is resolved.
     */
    command: AnyCommand;

    /**
     * One metadata entry for every route segment except the command leaf.
     *
     * A flat command has no groups, a direct subcommand has one group, and a
     * grouped subcommand has two groups.
     */
    groups?: readonly CommandGroup[];
}

/**
 * Creates a normalized, case-insensitive lookup key for a command path.
 *
 * @internal
 */
export function createRouteKey(path: readonly string[]): string {
    return path.map((segment) => segment.toLowerCase()).join(" ");
}

function getSegmentAliases(
    route: CommandRoute,
    index: number,
): readonly string[] {
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
export function createRouteLookupKeys(route: CommandRoute): string[] {
    const variants = route.path.map((segment, index) => [
        segment,
        ...getSegmentAliases(route, index),
    ]);

    let keys: string[][] = [[]];

    for (const segmentVariants of variants) {
        keys = keys.flatMap((prefix) =>
            segmentVariants.map((segment) => [...prefix, segment]),
        );
    }

    return [...new Set(keys.map(createRouteKey))];
}

/**
 * Result of matching a prefix-command route.
 *
 * @internal
 */
export interface ResolvedMessageRoute {
    route: CommandRoute;
    consumedTokens: number;
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
    public readonly routes = new Collection<string, CommandRoute>();

    /**
     * Canonical routes and every prefix-alias combination.
     */
    public readonly commands = new Collection<string, AnyCommand>();

    private readonly routeLookup = new Collection<string, CommandRoute>();

    /**
     * Registers a collection of routes as one atomic operation.
     *
     * @param routes - Routes to validate and register.
     *
     * @throws Error when a route is invalid or when a path or alias conflicts
     * with another route.
     */
    public register(routes: readonly CommandRoute[]): void {
        const stagedCanonical = new Map<string, CommandRoute>();
        const stagedLookup = new Map<string, CommandRoute>();

        for (const route of routes) {
            validateCommandRoute(route);

            const canonicalKey = createRouteKey(route.path);

            if (
                this.routes.has(canonicalKey) ||
                stagedCanonical.has(canonicalKey)
            ) {
                throw new Error(
                    `Command route "${canonicalKey}" is already registered.`,
                );
            }

            stagedCanonical.set(canonicalKey, route);

            for (const lookupKey of createRouteLookupKeys(route)) {
                const existing =
                    stagedLookup.get(lookupKey) ??
                    this.routeLookup.get(lookupKey);

                if (
                    existing &&
                    createRouteKey(existing.path) !== canonicalKey
                ) {
                    throw new Error(
                        `Command route or alias "${lookupKey}" is already ` +
                            `registered by "${existing.path.join(" ")}".`,
                    );
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
    public getCanonical(path: readonly string[]): CommandRoute | null {
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
    public resolveMessage(
        tokens: readonly string[],
    ): ResolvedMessageRoute | null {
        const maximumRouteLength = Math.min(3, tokens.length);

        for (let length = maximumRouteLength; length >= 1; length--) {
            const route = this.routeLookup.get(
                createRouteKey(tokens.slice(0, length)),
            );

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
