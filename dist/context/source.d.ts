import { type ChatInputCommandInteraction, type Guild, GuildMember, type Message, type User } from "discord.js";
export type CommandPayload = ChatInputCommandInteraction | Message;
export type CommandSource = {
    kind: "interaction";
    raw: ChatInputCommandInteraction;
} | {
    kind: "message";
    raw: Message;
};
/**
 * Identifies how a command was invoked.
 */
export type CommandInvocationKind = CommandSource["kind"];
/**
 * Discord client associated with a command invocation.
 */
export type CommandClient = CommandPayload["client"];
/**
 * Channel associated with a command invocation.
 *
 * Interaction channels may be unavailable when Discord.js cannot resolve
 * the channel from its cache.
 */
export type CommandChannel = CommandPayload["channel"];
/**
 * Discord locale associated with an interaction.
 */
export type CommandLocale = ChatInputCommandInteraction["locale"];
export declare function createCommandSource(payload: CommandPayload): CommandSource;
/**
 * Normalizes message and interaction command payloads into a shared shape.
 *
 * @internal
 */
export declare class CommandInvocation {
    readonly source: CommandSource;
    readonly kind: CommandInvocationKind;
    readonly raw: CommandPayload;
    readonly isInteraction: boolean;
    readonly isMessage: boolean;
    readonly client: CommandClient;
    readonly id: string;
    readonly user: User;
    readonly userId: string;
    readonly channel: CommandChannel;
    readonly channelId: string;
    readonly guild: Guild | null;
    readonly guildId: string | null;
    readonly createdAt: Date;
    readonly createdTimestamp: number;
    readonly locale: CommandLocale | null;
    readonly guildLocale: CommandLocale | null;
    private resolvedMember;
    constructor(source: CommandSource);
    get interaction(): ChatInputCommandInteraction | null;
    get message(): Message | null;
    get member(): GuildMember | null;
    fetchMember(): Promise<GuildMember | null>;
}
//# sourceMappingURL=source.d.ts.map