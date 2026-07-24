import type { PermissionResolvable } from "discord.js";
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
export function getEffectiveCommandAccess(
    route: CommandRoute,
): EffectiveCommandAccess {
    const groups = route.groups ?? [];

    return {
        devOnly:
            route.command.devOnly === true ||
            groups.some((group) => group.devOnly === true),

        guildOnly:
            route.command.guildOnly === true ||
            groups.some((group) => group.guildOnly === true),

        userPermissions: [
            ...groups.flatMap((group) => group.userPermissions ?? []),
            ...(route.command.userPermissions ?? []),
        ],

        botPermissions: [
            ...groups.flatMap((group) => group.botPermissions ?? []),
            ...(route.command.botPermissions ?? []),
        ],
    };
}

/**
 * Returns whether a route is enabled for slash-command registration.
 *
 * A route is disabled when either its command or one of its parent groups has
 * `slash` set to `false`.
 *
 * @internal
 */
export function isSlashRouteEnabled(route: CommandRoute): boolean {
    return (
        route.command.slash !== false &&
        (route.groups ?? []).every((group) => group.slash !== false)
    );
}

type AccessControllerConfig = Required<
    Pick<CommandHandlerConfig, "allowBots" | "allowOnlyDevs" | "devIds">
> & {
    isIgnored?: CommandHandlerConfig["isIgnored"];
};

/**
 * Applies global user filtering and route-specific access checks.
 *
 * @internal
 */
export class CommandAccessController {
    public constructor(private readonly config: AccessControllerConfig) {}

    private isDeveloper(userId: string): boolean {
        return this.config.devIds.includes(userId);
    }

    /**
     * Returns whether a user is globally eligible for command processing.
     *
     * This check covers bot users, ignored users, and global developer-only
     * mode. Rejected users are ignored silently.
     */
    public canProcessUser(userId: string, isBot: boolean): boolean {
        if (isBot && !this.config.allowBots) {
            return false;
        }

        if (this.config.isIgnored?.(userId)) {
            return false;
        }

        if (this.config.allowOnlyDevs && !this.isDeveloper(userId)) {
            return false;
        }

        return true;
    }

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
    public async checkRoute(
        route: CommandRoute,
        context: CommandContext<Record<string, never>>,
    ): Promise<boolean> {
        const access = getEffectiveCommandAccess(route);

        if (access.devOnly && !this.isDeveloper(context.userId)) {
            return false;
        }

        if (access.guildOnly && !context.guildOrNull) {
            await context.replyError(
                "This command can only be used in a server.",
            );

            return false;
        }

        const guild = context.guildOrNull;

        if (!guild) {
            return true;
        }

        const channel = context.raw.channel;

        if (!channel?.isTextBased() || channel.isDMBased()) {
            return true;
        }

        const member = context.member ?? (await context.fetchMember());

        if (!member) {
            await context.replyError(
                "Could not resolve your server member data.",
            );

            return false;
        }

        if (access.userPermissions.length > 0) {
            const missingPermissions = member
                .permissionsIn(channel)
                .missing(access.userPermissions);

            if (missingPermissions.length > 0) {
                await context.replyError(
                    "You lack the required permissions to use this: " +
                        `\`${missingPermissions.join(", ")}\``,
                );

                return false;
            }
        }

        if (access.botPermissions.length > 0) {
            const botMember =
                guild.members.me ??
                (await guild.members.fetchMe().catch(() => null));

            if (!botMember) {
                await context.replyError(
                    "Could not resolve my server member data.",
                );

                return false;
            }

            const missingPermissions = botMember
                .permissionsIn(channel)
                .missing(access.botPermissions);

            if (missingPermissions.length > 0) {
                await context.replyError(
                    "I am missing permissions to execute this: " +
                        `\`${missingPermissions.join(", ")}\``,
                );

                return false;
            }
        }

        return true;
    }
}
