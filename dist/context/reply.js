import { MessageFlags } from "discord.js";
function getReplyOptions(payload) {
    return typeof payload === "string" ? { content: payload } : payload;
}
function getComponentFlags(payload) {
    return payload.components === undefined
        ? undefined
        : MessageFlags.IsComponentsV2;
}
/**
 * Centralized helper to map CommandReplyPayload to Discord.js message options.
 */
function buildMessageOptions(payload, isInitialInteraction = false) {
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
export function toInteractionReplyOptions(payload) {
    return buildMessageOptions(payload, true);
}
export function toInteractionEditReplyOptions(payload) {
    return buildMessageOptions(payload, false);
}
export function toMessageReplyOptions(payload) {
    return buildMessageOptions(payload, false);
}
export function toMessageEditOptions(payload) {
    return buildMessageOptions(payload, false);
}
//# sourceMappingURL=reply.js.map