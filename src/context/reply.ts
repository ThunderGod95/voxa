import type {
    APIContainerComponent,
    APIEmbed,
    APIFileComponent,
    APIMediaGalleryComponent,
    APISectionComponent,
    APISeparatorComponent,
    APITextDisplayComponent,
    ContainerComponentData,
    FileComponentData,
    InteractionEditReplyOptions,
    InteractionReplyOptions,
    JSONEncodable,
    MediaGalleryComponentData,
    MessageEditOptions,
    MessageMentionOptions,
    MessageReplyOptions,
    SectionComponentData,
    SeparatorComponentData,
    TextDisplayComponentData,
} from "discord.js";
import { MessageFlags } from "discord.js";

type ComponentV2 =
    | APIContainerComponent
    | APIFileComponent
    | APIMediaGalleryComponent
    | APISectionComponent
    | APISeparatorComponent
    | APITextDisplayComponent
    | ContainerComponentData
    | FileComponentData
    | MediaGalleryComponentData
    | SectionComponentData
    | SeparatorComponentData
    | TextDisplayComponentData
    | JSONEncodable<
          | APIContainerComponent
          | APIFileComponent
          | APIMediaGalleryComponent
          | APISectionComponent
          | APISeparatorComponent
          | APITextDisplayComponent
      >;

interface BaseReplyOptions {
    /**
     * Applies MessageFlags.Ephemeral to interaction replies.
     *
     * This option has no effect on message commands or interaction edits.
     */
    ephemeral?: boolean;

    /** Controls which mentions are permitted to ping users or roles. */
    mentions?: MessageMentionOptions;
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
    components: readonly ComponentV2[];
}

export type CommandReplyOptions =
    TraditionalReplyOptions | ComponentV2ReplyOptions;

export type CommandReplyPayload = string | CommandReplyOptions;

function getReplyOptions(payload: CommandReplyPayload): CommandReplyOptions {
    return typeof payload === "string" ? { content: payload } : payload;
}

function getComponentFlags(
    payload: CommandReplyOptions,
): MessageFlags.IsComponentsV2 | undefined {
    return payload.components === undefined
        ? undefined
        : MessageFlags.IsComponentsV2;
}

/**
 * Centralized helper to map CommandReplyPayload to Discord.js message options.
 */
function buildMessageOptions(
    payload: CommandReplyPayload,
    isInitialInteraction = false,
) {
    const options = getReplyOptions(payload);
    let flags = getComponentFlags(options) ?? 0;

    if (isInitialInteraction && options.ephemeral) {
        flags |= MessageFlags.Ephemeral;
    }

    const base = {
        allowedMentions: options.mentions,
        flags: flags || undefined,
    };

    if (options.components !== undefined) {
        return {
            ...base,
            components: options.components,
        };
    }

    return {
        ...base,
        content: options.content,
        embeds: options.embeds,
    };
}

export function toInteractionReplyOptions(
    payload: CommandReplyPayload,
): InteractionReplyOptions {
    return buildMessageOptions(payload, true);
}

export function toInteractionEditReplyOptions(
    payload: CommandReplyPayload,
): InteractionEditReplyOptions {
    return buildMessageOptions(payload, false);
}

export function toMessageReplyOptions(
    payload: CommandReplyPayload,
): MessageReplyOptions {
    return buildMessageOptions(payload, false);
}

export function toMessageEditOptions(
    payload: CommandReplyPayload,
): MessageEditOptions {
    return buildMessageOptions(payload, false);
}
