import { Collection } from "discord.js";
import type { AnyCommand, CommandGroup } from "./command";
/**
 * A canonical command path supported by Discord.
 *
 * The tuple represents one of these forms:
 *
 * - `[command]`
 * - `[command, subcommand]`
 * - `[command, subcommandGroup, subcommand]`
 */
export type CommandPath = readonly [string] | readonly [string, string] | readonly [string, string, string];
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
export declare function createRouteKey(path: readonly string[]): string;
/**
 * Produces every canonical and aliased lookup key for a route prefix.
 *
 * @internal
 */
export declare function createRoutePrefixLookupKeys(route: CommandRoute, segmentCount: number): string[];
/**
 * Produces every canonical and aliased lookup key for a prefix route.
 *
 * For example, a route whose root and leaf both have one alias produces all
 * four combinations.
 *
 * @internal
 */
export declare function createRouteLookupKeys(route: CommandRoute): string[];
/**
 * Produces every canonical and aliased parent lookup key for a message-default
 * command route.
 *
 * The command leaf and its aliases are intentionally omitted because invoking
 * a message default means that no explicit subcommand segment was supplied.
 *
 * @internal
 */
export declare function createMessageDefaultLookupKeys(route: CommandRoute): string[];
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
 * Stores canonical command routes, prefix-command alias lookups, and
 * message-default parent lookups.
 *
 * Registration is transactional: an invalid or conflicting route prevents the
 * entire batch from being applied.
 *
 * @internal
 */
export declare class CommandRouteRegistry {
    /**
     * Canonical routes keyed by their normalized path.
     */
    readonly routes: Collection<string, CommandRoute>;
    /**
     * Prefix-command lookup containing canonical routes, aliases, and
     * message-default parent paths.
     */
    readonly commands: Collection<string, AnyCommand>;
    private readonly routeLookup;
    private readonly messageDefaultLookup;
    /**
     * Registers a collection of routes as one atomic operation.
     *
     * @param routes - Routes to validate and register.
     *
     * @throws Error when a route is invalid or when a path, alias, or
     * message-default parent conflicts with another route.
     */
    register(routes: readonly CommandRoute[]): void;
    /**
     * Resolves an exact canonical route.
     *
     * Slash interactions use canonical Discord names and therefore do not use
     * the alias or message-default lookups.
     *
     * @param path - Canonical route segments.
     */
    getCanonical(path: readonly string[]): CommandRoute | null;
    /**
     * Resolves the longest matching prefix-command route.
     *
     * Explicit canonical and aliased routes are checked before message-default
     * parent routes. This guarantees that an explicitly supplied subcommand
     * always wins over a default subcommand.
     *
     * @param tokens - Tokenized prefix-command input.
     */
    resolveMessage(tokens: readonly string[]): ResolvedMessageRoute | null;
}
//# sourceMappingURL=route.d.ts.map