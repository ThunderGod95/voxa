import type { AutocompleteInteraction, PermissionResolvable } from "discord.js";
import type { CommandContext } from "../context";
import type { CommandHandlerConfig } from "./command";
import type { CommandRoute } from "./route";
/**
 * Effective access restrictions inherited by a command route.
 *
 * @internal
 */
export interface EffectiveCommandAccess {
    devOnly: boolean;
    guildOnly: boolean;
    userPermissions: readonly PermissionResolvable[];
    botPermissions: readonly PermissionResolvable[];
}
/**
 * Computes the cumulative group and command access settings for a route.
 *
 * @internal
 */
export declare function getEffectiveCommandAccess(route: CommandRoute): EffectiveCommandAccess;
/**
 * Returns whether a route is enabled for slash-command registration.
 *
 * A route is disabled when either its command or one of its parent groups has
 * `slash` set to `false`.
 *
 * @internal
 */
export declare function isSlashRouteEnabled(route: CommandRoute): boolean;
type AccessControllerConfig = Required<Pick<CommandHandlerConfig, "allowBots" | "allowOnlyDevs" | "devIds">> & {
    isIgnored?: CommandHandlerConfig["isIgnored"];
};
/**
 * Applies global user filtering and route-specific access checks.
 *
 * @internal
 */
export declare class CommandAccessController {
    private readonly config;
    constructor(config: AccessControllerConfig);
    private isDeveloper;
    /**
     * Returns whether a user is globally eligible for command processing.
     *
     * This check covers bot users, ignored users, and global developer-only
     * mode. Rejected users are ignored silently.
     */
    canProcessUser(userId: string, isBot: boolean): boolean;
    /**
     * Verifies inherited developer restrictions, guild restrictions, and
     * channel permissions for a route.
     *
     * Developer-only failures are ignored silently, matching global
     * developer-only mode. Other access failures are rendered through the
     * supplied command context.
     *
     * @param route - Route being invoked.
     * @param context - Context used to inspect the invocation and send errors.
     */
    checkRoute(route: CommandRoute, context: CommandContext<Record<string, never>>): Promise<boolean>;
    checkAutocompleteRoute(route: CommandRoute, interaction: AutocompleteInteraction): boolean;
}
export {};
//# sourceMappingURL=access.d.ts.map