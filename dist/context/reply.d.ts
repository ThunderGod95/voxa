import type { APIEmbed, InteractionEditReplyOptions, InteractionReplyOptions, JSONEncodable, MessageEditOptions, MessageMentionOptions, MessageReplyOptions } from "discord.js";
/**
 * Any top-level message component accepted by Discord.js.
 */
export type CommandReplyComponent = NonNullable<InteractionReplyOptions["components"]>[number];
/**
 * Any uploaded file accepted by Discord.js interaction replies.
 */
export type CommandReplyFile = NonNullable<InteractionReplyOptions["files"]>[number];
interface BaseReplyOptions {
    /**
     * Applies MessageFlags.Ephemeral to interaction replies.
     *
     * This option has no effect on message commands or interaction edits.
     */
    ephemeral?: boolean;
    /** Controls which mentions are permitted to ping users or roles. */
    mentions?: MessageMentionOptions;
    /**
     * Files uploaded with the reply.
     *
     * File components reference these uploads through
     * `attachment://<filename>` URLs.
     */
    files?: readonly CommandReplyFile[];
}
/**
 * A traditional Discord message using content or embeds.
 *
 * Components V2 cannot be combined with these fields.
 */
export interface TraditionalReplyOptions extends BaseReplyOptions {
    content?: string;
    embeds?: readonly (APIEmbed | JSONEncodable<APIEmbed>)[];
    components?: never;
}
/**
 * A Discord Components V2 message.
 *
 * Traditional content and embeds cannot be combined with Components V2.
 */
export interface ComponentV2ReplyOptions extends BaseReplyOptions {
    content?: never;
    embeds?: never;
    components: readonly CommandReplyComponent[];
}
export type CommandReplyOptions = TraditionalReplyOptions | ComponentV2ReplyOptions;
export type CommandReplyPayload = string | CommandReplyOptions;
export declare function toInteractionReplyOptions(payload: CommandReplyPayload): InteractionReplyOptions;
export declare function toInteractionEditReplyOptions(payload: CommandReplyPayload): InteractionEditReplyOptions;
export declare function toMessageReplyOptions(payload: CommandReplyPayload): MessageReplyOptions;
export declare function toMessageEditOptions(payload: CommandReplyPayload): MessageEditOptions;
export {};
//# sourceMappingURL=reply.d.ts.map