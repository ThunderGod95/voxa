import type { Message, PermissionResolvable } from "discord.js";
import type { ArgumentSchema, ParsedArguments } from "../arguments";
import type {
    CommandContext,
    CommandFeedbackRenderer,
    CommandLogger,
} from "../context";

/** @internal Empty schema used by commands that declare no arguments. */
export const EMPTY_ARGUMENTS = {} as const satisfies ArgumentSchema;

/**
 * Describes a command before it is assigned to a concrete route.
 *
 * Directory-loaded commands may omit `name`; the command loader derives the
 * name from the module filename. Commands registered directly through
 * `CommandManager.registerCommands()` must include a name.
 *
 * @typeParam Schema - Argument schema used to infer `ctx.args`.
 */
export interface CommandDefinition<
    Schema extends ArgumentSchema = typeof EMPTY_ARGUMENTS,
> {
    /**
     * Canonical lowercase command name.
     *
     * Names must contain 1–32 lowercase letters, numbers, hyphens, or
     * underscores. This may be omitted only for directory-loaded commands.
     */
    name?: string;

    /**
     * Human-readable command description.
     *
     * Discord requires descriptions to contain between 1 and 100 characters.
     */
    description: string;

    /**
     * Alternative names accepted by prefix commands.
     *
     * Aliases do not create additional slash-command names.
     */
    aliases?: readonly string[];

    /**
     * Strongly typed argument schema shared by prefix and slash commands.
     *
     * Parsed values are exposed through `ctx.args`.
     */
    arguments?: Schema;

    /**
     * Whether this command is registered as a slash command.
     *
     * Prefix-command availability is unaffected.
     *
     * @defaultValue true
     */
    slash?: boolean;

    /**
     * Whether the command may only be executed inside a guild.
     *
     * When enabled, attempts to use the command in a DM receive an error
     * response.
     */
    guildOnly?: boolean;

    /**
     * Restricts this command to users listed in the command manager's
     * `devIds` configuration.
     *
     * This restriction is also inherited from parent command groups.
     *
     * @defaultValue false
     */
    devOnly?: boolean;

    /**
     * Executes this command when its parent route is invoked without an explicit
     * subcommand in a prefix message.
     *
     * This has no effect on slash commands.
     *
     * @defaultValue false
     */
    messageDefault?: boolean;

    /**
     * Permissions the invoking guild member must have in the current channel.
     */
    userPermissions?: readonly PermissionResolvable[];

    /**
     * Permissions the bot must have in the current channel.
     */
    botPermissions?: readonly PermissionResolvable[];

    /**
     * Executes the command with validated and strongly typed arguments.
     *
     * Errors thrown from this function are logged, reported to the user, and
     * emitted through the manager's `commandError` lifecycle event.
     */
    execute(ctx: CommandContext<ParsedArguments<Schema>>): Promise<void> | void;
}

/**
 * A command with a concrete canonical name.
 *
 * This is the form accepted by direct registration and stored by the command
 * manager after directory resolution.
 */
export type Command<Schema extends ArgumentSchema = typeof EMPTY_ARGUMENTS> =
    CommandDefinition<Schema> & {
        name: string;
    };

/**
 * A command whose specific argument schema is not statically known.
 *
 * Framework internals use this type after command definitions have been
 * collected into a heterogeneous registry.
 */
export type AnyCommand = Command<ArgumentSchema>;

/**
 * A command definition whose specific argument schema is not statically known.
 */
export type AnyCommandDefinition = CommandDefinition<ArgumentSchema>;

/**
 * Defines a command while preserving literal argument-schema inference.
 *
 * This function does not register or modify the command. It exists to preserve
 * the exact schema type so that `ctx.args` is inferred automatically.
 *
 * @example
 * ```ts
 * const command = defineCommand({
 *     name: "greet",
 *     description: "Greets a user.",
 *     arguments: {
 *         user: argument.user({
 *             description: "The user to greet.",
 *             required: true,
 *         }),
 *     },
 *     execute(ctx) {
 *         ctx.args.user;
 *     },
 * });
 * ```
 */
export function defineCommand<
    const Schema extends ArgumentSchema = typeof EMPTY_ARGUMENTS,
>(command: Command<Schema>): Command<Schema>;

/**
 * Defines a directory-loaded command whose name may be derived from its
 * filename.
 */
export function defineCommand<
    const Schema extends ArgumentSchema = typeof EMPTY_ARGUMENTS,
>(command: CommandDefinition<Schema>): CommandDefinition<Schema>;

export function defineCommand<
    const Schema extends ArgumentSchema = typeof EMPTY_ARGUMENTS,
>(command: CommandDefinition<Schema>): CommandDefinition<Schema> {
    return command;
}

/**
 * Metadata inherited by commands beneath a command directory.
 *
 * Group settings are cumulative. Nested commands inherit guild restrictions,
 * developer restrictions, and permission requirements from every parent group.
 */
export interface CommandGroup {
    /**
     * Description used for the root slash command or slash subcommand group.
     */
    description: string;

    /**
     * Alternative path-segment names accepted by prefix commands.
     *
     * Group aliases do not affect slash-command paths.
     */
    aliases?: readonly string[];

    /**
     * Disables slash registration for all routes beneath this group.
     *
     * Prefix commands remain available.
     *
     * @defaultValue true
     */
    slash?: boolean;

    /**
     * Restricts every route beneath this group to guilds.
     */
    guildOnly?: boolean;

    /**
     * Restricts every route beneath this group to users listed in the command
     * manager's `devIds` configuration.
     *
     * Nested groups and commands cannot remove this restriction.
     *
     * @defaultValue false
     */
    devOnly?: boolean;

    /**
     * User permissions inherited by routes beneath this group.
     */
    userPermissions?: readonly PermissionResolvable[];

    /**
     * Bot permissions inherited by routes beneath this group.
     */
    botPermissions?: readonly PermissionResolvable[];
}

/**
 * Defines command-group metadata while preserving its inferred type.
 *
 * This function does not register or modify the group.
 */
export function defineCommandGroup(group: CommandGroup): CommandGroup {
    return group;
}

/**
 * Configuration used when constructing a `CommandManager`.
 */
export interface CommandHandlerConfig {
    /**
     * Prefix used for message commands.
     *
     * A resolver may return a different prefix for each message, guild, or
     * channel. Both synchronous and asynchronous resolvers are supported.
     */
    prefix: string | ((message: Message) => string | Promise<string>);

    /**
     * Restricts all command execution to users listed in `devIds`.
     *
     * @defaultValue false
     */
    allowOnlyDevs?: boolean;

    /**
     * User IDs recognized as bot developers.
     *
     * These IDs are used by the global `allowOnlyDevs` option and by commands
     * or groups whose `devOnly` option is enabled.
     *
     * @defaultValue []
     */
    devIds?: readonly string[];

    /**
     * Logger used for execution failures and responder warnings.
     *
     * The framework's console-based logger is used by default.
     */
    logger?: CommandLogger;

    /**
     * Renderer used by `ctx.replyError()` and `ctx.replySuccess()`.
     *
     * The default renderer produces Discord Components V2 responses.
     */
    feedbackRenderer?: CommandFeedbackRenderer;

    /**
     * Returns `true` when a user should be ignored silently.
     *
     * Ignored users do not receive an error response.
     */
    isIgnored?: (userId: string) => boolean;

    /**
     * Whether bot-authored messages and interactions may invoke commands.
     *
     * @defaultValue false
     */
    allowBots?: boolean;
}
