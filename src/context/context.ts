import type {
    ChatInputCommandInteraction,
    Guild,
    GuildMember,
    Message,
    User,
} from "discord.js";
import {
    type CommandFeedbackRenderer,
    defaultCommandFeedbackRenderer,
} from "./feedback";
import { type CommandLogger, defaultCommandLogger } from "./logger";
import type { CommandReplyPayload } from "./reply";
import { type CommandResponder, createCommandResponder } from "./responder";
import {
    type CommandChannel,
    type CommandClient,
    CommandInvocation,
    type CommandInvocationKind,
    type CommandLocale,
    type CommandPayload,
    createCommandSource,
} from "./source";

export interface CommandContextOptions {
    logger?: CommandLogger;
    feedbackRenderer?: CommandFeedbackRenderer;
}

/**
 * Shared execution context provided to message and interaction commands.
 */
export class CommandContext<Arguments extends object = Record<string, never>> {
    /**
     * Arguments parsed and validated against the command's argument schema.
     */
    public readonly args: Arguments;

    private readonly invocation: CommandInvocation;
    private readonly responder: CommandResponder;
    private readonly feedbackRenderer: CommandFeedbackRenderer;

    public constructor(
        payload: CommandPayload,
        args: Arguments,
        options: CommandContextOptions = {},
    ) {
        const logger = options.logger ?? defaultCommandLogger;
        const source = createCommandSource(payload);

        this.args = args;
        this.invocation = new CommandInvocation(source);
        this.responder = createCommandResponder(source, logger);
        this.feedbackRenderer =
            options.feedbackRenderer ?? defaultCommandFeedbackRenderer;
    }

    /**
     * Original Discord.js message or interaction.
     */
    public get raw(): CommandPayload {
        return this.invocation.raw;
    }

    /**
     * How the command was invoked.
     */
    public get kind(): CommandInvocationKind {
        return this.invocation.kind;
    }

    /**
     * Whether the command was invoked through an application command.
     */
    public get isInteraction(): boolean {
        return this.invocation.isInteraction;
    }

    /**
     * Whether the command was invoked through a Discord message.
     */
    public get isMessage(): boolean {
        return this.invocation.isMessage;
    }

    /**
     * Discord client that received the invocation.
     */
    public get client(): CommandClient {
        return this.invocation.client;
    }

    /**
     * ID of the underlying message or interaction.
     */
    public get id(): string {
        return this.invocation.id;
    }

    /**
     * Interaction that invoked the command, or null for message commands.
     */
    public get interaction(): ChatInputCommandInteraction | null {
        return this.invocation.interaction;
    }

    /**
     * Message that invoked the command, or null for interaction commands.
     */
    public get message(): Message | null {
        return this.invocation.message;
    }

    /**
     * User who invoked the command.
     */
    public get user(): User {
        return this.invocation.user;
    }

    /**
     * ID of the user who invoked the command.
     */
    public get userId(): string {
        return this.invocation.userId;
    }

    /**
     * Channel in which the command was invoked.
     *
     * This can be null when Discord.js cannot resolve an interaction channel.
     */
    public get channel(): CommandChannel {
        return this.invocation.channel;
    }

    /**
     * ID of the channel in which the command was invoked.
     */
    public get channelId(): string {
        return this.invocation.channelId;
    }

    /**
     * Guild in which the command was invoked.
     *
     * Throws when accessed for a direct-message invocation. DM-aware commands
     * should use guildOrNull or isGuild first.
     */
    public get guild(): Guild {
        const guild = this.invocation.guild;

        if (!guild) {
            throw new Error("This command was not invoked in a guild.");
        }

        return guild;
    }

    /**
     * Guild in which the command was invoked, or null in direct messages.
     */
    public get guildOrNull(): Guild | null {
        return this.invocation.guild;
    }

    /**
     * ID of the invocation guild, or null in direct messages.
     *
     * This remains available even when the complete guild object is not needed.
     */
    public get guildId(): string | null {
        return this.invocation.guildId;
    }

    /**
     * Whether the command was invoked inside a guild.
     */
    public get isGuild(): boolean {
        return this.invocation.guild !== null;
    }

    /**
     * Cached guild member associated with the invoking user.
     *
     * Use fetchMember() when the member is not already available.
     */
    public get member(): GuildMember | null {
        return this.invocation.member;
    }

    /**
     * Returns the invoking guild member, fetching it when necessary.
     */
    public fetchMember(): Promise<GuildMember | null> {
        return this.invocation.fetchMember();
    }

    /**
     * Time at which the underlying message or interaction was created.
     */
    public get createdAt(): Date {
        return this.invocation.createdAt;
    }

    /**
     * Unix timestamp, in milliseconds, at which the invocation was created.
     */
    public get createdTimestamp(): number {
        return this.invocation.createdTimestamp;
    }

    /**
     * User locale supplied by Discord for interaction commands.
     *
     * Message commands do not contain user locale information.
     */
    public get locale(): CommandLocale | null {
        return this.invocation.locale;
    }

    /**
     * Preferred locale of the invocation guild.
     *
     * For interactions, this uses Discord's interaction locale payload. For
     * message commands, it uses the resolved guild's preferred locale.
     */
    public get guildLocale(): CommandLocale | null {
        return this.invocation.guildLocale;
    }

    public deferReply(ephemeral = false): Promise<void> {
        return this.responder.deferReply(ephemeral);
    }

    public editReply(payload: CommandReplyPayload): Promise<Message> {
        return this.responder.editReply(payload);
    }

    public reply(payload: CommandReplyPayload): Promise<Message> {
        return this.responder.editReply(payload);
    }

    public followUp(payload: CommandReplyPayload): Promise<Message> {
        return this.responder.followUp(payload);
    }

    public replyError(message: string): Promise<Message> {
        return this.reply(this.feedbackRenderer.error(message));
    }

    public replySuccess(message: string): Promise<Message> {
        return this.reply(this.feedbackRenderer.success(message));
    }
}
