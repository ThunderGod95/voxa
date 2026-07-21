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
    CommandInvocation,
    type CommandPayload,
    createCommandSource,
} from "./source";

export interface CommandContextOptions {
    logger?: CommandLogger;
    feedbackRenderer?: CommandFeedbackRenderer;
}

export class CommandContext<Arguments extends object = Record<string, never>> {
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

    public get raw(): CommandPayload {
        return this.invocation.raw;
    }

    public get isInteraction(): boolean {
        return this.invocation.isInteraction;
    }

    public get interaction(): ChatInputCommandInteraction | null {
        return this.invocation.interaction;
    }

    public get message(): Message | null {
        return this.invocation.message;
    }

    public get user(): User {
        return this.invocation.user;
    }

    public get guild(): Guild | null {
        return this.invocation.guild;
    }

    public get member(): GuildMember | null {
        return this.invocation.member;
    }

    public fetchMember(): Promise<GuildMember | null> {
        return this.invocation.fetchMember();
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
