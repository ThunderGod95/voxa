import { type ChatInputCommandInteraction, type Guild, GuildMember, type Message, type User } from "discord.js";
export type CommandPayload = ChatInputCommandInteraction | Message;
export type CommandSource = {
    kind: "interaction";
    raw: ChatInputCommandInteraction;
} | {
    kind: "message";
    raw: Message;
};
export declare function createCommandSource(payload: CommandPayload): CommandSource;
export declare class CommandInvocation {
    readonly source: CommandSource;
    readonly raw: CommandPayload;
    readonly isInteraction: boolean;
    readonly user: User;
    readonly guild: Guild | null;
    private resolvedMember;
    constructor(source: CommandSource);
    get interaction(): ChatInputCommandInteraction | null;
    get message(): Message | null;
    get member(): GuildMember | null;
    fetchMember(): Promise<GuildMember | null>;
}
//# sourceMappingURL=source.d.ts.map