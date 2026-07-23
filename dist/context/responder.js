import { MessageFlags, } from "discord.js";
import { toInteractionEditReplyOptions, toInteractionReplyOptions, toMessageEditOptions, toMessageReplyOptions, } from "./reply";
class InteractionCommandResponder {
    interaction;
    constructor(interaction) {
        this.interaction = interaction;
    }
    async deferReply(ephemeral = false) {
        if (this.interaction.deferred || this.interaction.replied) {
            return;
        }
        await this.interaction.deferReply({
            flags: ephemeral ? MessageFlags.Ephemeral : undefined,
        });
    }
    async editReply(payload) {
        if (this.interaction.deferred || this.interaction.replied) {
            return this.interaction.editReply(toInteractionEditReplyOptions(payload));
        }
        await this.interaction.reply(toInteractionReplyOptions(payload));
        return this.interaction.fetchReply();
    }
    async followUp(payload) {
        if (!this.interaction.deferred && !this.interaction.replied) {
            await this.interaction.reply(toInteractionReplyOptions(payload));
            return this.interaction.fetchReply();
        }
        return this.interaction.followUp(toInteractionReplyOptions(payload));
    }
}
class MessageCommandResponder {
    message;
    logger;
    replyMessage = null;
    constructor(message, logger) {
        this.message = message;
        this.logger = logger;
    }
    async deferReply() {
        const channel = this.message.channel;
        if (!("sendTyping" in channel)) {
            return;
        }
        await channel.sendTyping().catch((error) => {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Failed to send a typing indicator in channel ${channel.id}: ${errorMessage}`);
        });
    }
    async editReply(payload) {
        if (this.replyMessage) {
            return this.replyMessage.edit(toMessageEditOptions(payload));
        }
        this.replyMessage = await this.message.reply(toMessageReplyOptions(payload));
        return this.replyMessage;
    }
    followUp(payload) {
        return this.message.reply(toMessageReplyOptions(payload));
    }
}
export function createCommandResponder(source, logger) {
    return source.kind === "interaction"
        ? new InteractionCommandResponder(source.raw)
        : new MessageCommandResponder(source.raw, logger);
}
//# sourceMappingURL=responder.js.map