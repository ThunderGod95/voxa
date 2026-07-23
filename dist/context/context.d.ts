import type { ChatInputCommandInteraction, Guild, GuildMember, Message, User } from "discord.js";
import { type CommandFeedbackRenderer } from "./feedback";
import { type CommandLogger } from "./logger";
import type { CommandReplyPayload } from "./reply";
import { type CommandPayload } from "./source";
export interface CommandContextOptions {
    logger?: CommandLogger;
    feedbackRenderer?: CommandFeedbackRenderer;
}
export declare class CommandContext<Arguments extends object = Record<string, never>> {
    readonly args: Arguments;
    private readonly invocation;
    private readonly responder;
    private readonly feedbackRenderer;
    constructor(payload: CommandPayload, args: Arguments, options?: CommandContextOptions);
    get raw(): CommandPayload;
    get isInteraction(): boolean;
    get interaction(): ChatInputCommandInteraction | null;
    get message(): Message | null;
    get user(): User;
    get guild(): Guild | null;
    get member(): GuildMember | null;
    fetchMember(): Promise<GuildMember | null>;
    deferReply(ephemeral?: boolean): Promise<void>;
    editReply(payload: CommandReplyPayload): Promise<Message>;
    reply(payload: CommandReplyPayload): Promise<Message>;
    followUp(payload: CommandReplyPayload): Promise<Message>;
    replyError(message: string): Promise<Message>;
    replySuccess(message: string): Promise<Message>;
}
//# sourceMappingURL=context.d.ts.map