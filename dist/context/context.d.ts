import type { ChatInputCommandInteraction, Guild, GuildMember, Message, MessageCollector, MessageComponentType, ModalSubmitInteraction, User } from "discord.js";
import { type CommandAwaitComponentOptions, type CommandAwaitMessageOptions, type CommandAwaitModalOptions, type CommandComponentCollector, type CommandComponentCollectorOptions, type CommandComponentInteraction, type CommandMessageCollectorOptions } from "./collectors";
import { type CommandFeedbackRenderer } from "./feedback";
import { type CommandLogger } from "./logger";
import type { CommandModalPayload, CommandReplyPayload } from "./reply";
import { type CommandChannel, type CommandClient, type CommandInvocationKind, type CommandLocale, type CommandPayload } from "./source";
export interface CommandContextOptions {
    logger?: CommandLogger;
    feedbackRenderer?: CommandFeedbackRenderer;
    devIds?: readonly string[];
}
/**
 * Shared execution context provided to message and interaction commands.
 */
export declare class CommandContext<Arguments extends object = Record<string, never>> {
    /**
     * Arguments parsed and validated against the command's argument schema.
     */
    readonly args: Arguments;
    /**
     * User IDs configured as bot developers.
     */
    readonly devIds: readonly string[];
    private readonly invocation;
    private readonly responder;
    private readonly feedbackRenderer;
    constructor(payload: CommandPayload, args: Arguments, options?: CommandContextOptions);
    /**
     * Original Discord.js message or interaction.
     */
    get raw(): CommandPayload;
    /**
     * How the command was invoked.
     */
    get kind(): CommandInvocationKind;
    /**
     * Whether the command was invoked through an application command.
     */
    get isInteraction(): boolean;
    /**
     * Whether the command was invoked through a Discord message.
     */
    get isMessage(): boolean;
    /**
     * Discord client that received the invocation.
     */
    get client(): CommandClient;
    /**
     * ID of the underlying message or interaction.
     */
    get id(): string;
    /**
     * Interaction that invoked the command, or null for message commands.
     */
    get interaction(): ChatInputCommandInteraction | null;
    /**
     * Message that invoked the command, or null for interaction commands.
     */
    get message(): Message | null;
    /**
     * User who invoked the command.
     */
    get user(): User;
    /**
     * ID of the user who invoked the command.
     */
    get userId(): string;
    /**
     * Channel in which the command was invoked.
     *
     * This can be null when Discord.js cannot resolve an interaction channel.
     */
    get channel(): CommandChannel;
    /**
     * ID of the channel in which the command was invoked.
     */
    get channelId(): string;
    /**
     * Guild in which the command was invoked.
     *
     * Throws when accessed for a direct-message invocation. DM-aware commands
     * should use guildOrNull or isGuild first.
     */
    get guild(): Guild;
    /**
     * Guild in which the command was invoked, or null in direct messages.
     */
    get guildOrNull(): Guild | null;
    /**
     * ID of the invocation guild, or null in direct messages.
     *
     * This remains available even when the complete guild object is not needed.
     */
    get guildId(): string | null;
    /**
     * Whether the command was invoked inside a guild.
     */
    get isGuild(): boolean;
    /**
     * Cached guild member associated with the invoking user.
     *
     * Use fetchMember() when the member is not already available.
     */
    get member(): GuildMember | null;
    /**
     * Returns the invoking guild member, fetching it when necessary.
     */
    fetchMember(): Promise<GuildMember | null>;
    /**
     * Time at which the underlying message or interaction was created.
     */
    get createdAt(): Date;
    /**
     * Unix timestamp, in milliseconds, at which the invocation was created.
     */
    get createdTimestamp(): number;
    /**
     * User locale supplied by Discord for interaction commands.
     *
     * Message commands do not contain user locale information.
     */
    get locale(): CommandLocale | null;
    /**
     * Preferred locale of the invocation guild.
     *
     * For interactions, this uses Discord's interaction locale payload. For
     * message commands, it uses the resolved guild's preferred locale.
     */
    get guildLocale(): CommandLocale | null;
    deferReply(ephemeral?: boolean): Promise<void>;
    editReply(payload: CommandReplyPayload): Promise<Message>;
    reply(payload: CommandReplyPayload): Promise<Message>;
    followUp(payload: CommandReplyPayload): Promise<Message>;
    /**
     * Shows a modal as the initial response to an interaction.
     *
     * Throws for message commands or when the interaction has already been
     * acknowledged.
     */
    showModal(modal: CommandModalPayload): Promise<void>;
    /**
     * Awaits one component interaction on a specific message.
     *
     * By default, only interactions from the command's invoking user are
     * accepted.
     */
    awaitComponent<const ComponentType extends MessageComponentType, InGuild extends boolean>(message: Message<InGuild>, options: CommandAwaitComponentOptions<ComponentType, InGuild>): Promise<CommandComponentInteraction<ComponentType, InGuild>>;
    /**
     * Creates a native Discord.js component collector on a specific message.
     *
     * By default, only interactions from the command's invoking user are
     * accepted.
     */
    createComponentCollector<const ComponentType extends MessageComponentType, InGuild extends boolean>(message: Message<InGuild>, options: CommandComponentCollectorOptions<ComponentType, InGuild>): CommandComponentCollector<ComponentType, InGuild>;
    /**
     * Awaits one message in the command channel.
     *
     * By default, only messages from the command's invoking user are accepted.
     */
    awaitMessage(options?: CommandAwaitMessageOptions): Promise<Message>;
    /**
     * Creates a native Discord.js message collector in the command channel.
     *
     * By default, only messages from the command's invoking user are accepted.
     */
    createMessageCollector(options?: CommandMessageCollectorOptions): MessageCollector;
    /**
     * Awaits one modal submission.
     *
     * By default, only submissions from the command's invoking user are
     * accepted.
     *
     * Throws when used by a message command.
     */
    awaitModal(options: CommandAwaitModalOptions): Promise<ModalSubmitInteraction>;
    replyError(message: string): Promise<Message>;
    replySuccess(message: string): Promise<Message>;
}
//# sourceMappingURL=context.d.ts.map