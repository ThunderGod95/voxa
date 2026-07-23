/**
 * Computes the cumulative group and command access settings for a route.
 *
 * @internal
 */
export function getEffectiveCommandAccess(route) {
    const groups = route.groups ?? [];
    return {
        guildOnly: route.command.guildOnly === true ||
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
export function isSlashRouteEnabled(route) {
    return (route.command.slash !== false &&
        (route.groups ?? []).every((group) => group.slash !== false));
}
/**
 * Applies global user filtering and route-specific access checks.
 *
 * @internal
 */
export class CommandAccessController {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Returns whether a user is globally eligible for command processing.
     *
     * This check covers bot users, ignored users, and developer-only mode.
     * Rejected users are ignored silently.
     */
    canProcessUser(userId, isBot) {
        if (isBot && !this.config.allowBots) {
            return false;
        }
        if (this.config.isIgnored?.(userId)) {
            return false;
        }
        if (this.config.allowOnlyDevs && !this.config.devIds.includes(userId)) {
            return false;
        }
        return true;
    }
    /**
     * Verifies guild restrictions and channel permissions for a route.
     *
     * Access failures are rendered through the supplied command context.
     *
     * @param route - Route being invoked.
     * @param context - Context used to inspect the invocation and send errors.
     */
    async checkRoute(route, context) {
        const access = getEffectiveCommandAccess(route);
        if (access.guildOnly && !context.guild) {
            await context.replyError("This command can only be used in a server.");
            return false;
        }
        if (!context.guild) {
            return true;
        }
        const channel = context.raw.channel;
        if (!channel?.isTextBased() || channel.isDMBased()) {
            return true;
        }
        const member = context.member ?? (await context.fetchMember());
        if (!member) {
            await context.replyError("Could not resolve your server member data.");
            return false;
        }
        if (access.userPermissions.length > 0) {
            const missingPermissions = member
                .permissionsIn(channel)
                .missing(access.userPermissions);
            if (missingPermissions.length > 0) {
                await context.replyError("You lack the required permissions to use this: " +
                    `\`${missingPermissions.join(", ")}\``);
                return false;
            }
        }
        if (access.botPermissions.length > 0) {
            const botMember = context.guild.members.me ??
                (await context.guild.members.fetchMe().catch(() => null));
            if (!botMember) {
                await context.replyError("Could not resolve my server member data.");
                return false;
            }
            const missingPermissions = botMember
                .permissionsIn(channel)
                .missing(access.botPermissions);
            if (missingPermissions.length > 0) {
                await context.replyError("I am missing permissions to execute this: " +
                    `\`${missingPermissions.join(", ")}\``);
                return false;
            }
        }
        return true;
    }
}
//# sourceMappingURL=access.js.map