import {
    type ChatInputCommandInteraction,
    type Message,
    MessageFlags,
} from "discord.js";
import type { CommandLogger } from "./logger";
import {
    type CommandReplyPayload,
    toInteractionEditReplyOptions,
    toInteractionReplyOptions,
    toMessageEditOptions,
    toMessageReplyOptions,
} from "./reply";
import type { CommandSource } from "./source";

export interface CommandResponder {
    deferReply(ephemeral?: boolean): Promise<void>;
    editReply(payload: CommandReplyPayload): Promise<Message>;
    followUp(payload: CommandReplyPayload): Promise<Message>;
}

class InteractionCommandResponder implements CommandResponder {
    public constructor(
        private readonly interaction: ChatInputCommandInteraction,
    ) {}

    public async deferReply(ephemeral = false): Promise<void> {
        if (this.interaction.deferred || this.interaction.replied) {
            return;
        }

        await this.interaction.deferReply({
            flags: ephemeral ? MessageFlags.Ephemeral : undefined,
        });
    }

    public async editReply(payload: CommandReplyPayload): Promise<Message> {
        if (this.interaction.deferred || this.interaction.replied) {
            return this.interaction.editReply(
                toInteractionEditReplyOptions(payload),
            );
        }

        await this.interaction.reply(toInteractionReplyOptions(payload));

        return this.interaction.fetchReply();
    }

    public async followUp(payload: CommandReplyPayload): Promise<Message> {
        if (!this.interaction.deferred && !this.interaction.replied) {
            await this.interaction.reply(toInteractionReplyOptions(payload));

            return this.interaction.fetchReply();
        }

        return this.interaction.followUp(toInteractionReplyOptions(payload));
    }
}

class MessageCommandResponder implements CommandResponder {
    private replyMessage: Message | null = null;

    public constructor(
        private readonly message: Message,
        private readonly logger: CommandLogger,
    ) {}

    public async deferReply(): Promise<void> {
        const channel = this.message.channel;

        if (!("sendTyping" in channel)) {
            return;
        }

        await channel.sendTyping().catch((error: unknown) => {
            const errorMessage =
                error instanceof Error ? error.message : String(error);

            this.logger.warn(
                `Failed to send a typing indicator in channel ${channel.id}: ${errorMessage}`,
            );
        });
    }

    public async editReply(payload: CommandReplyPayload): Promise<Message> {
        if (this.replyMessage) {
            return this.replyMessage.edit(toMessageEditOptions(payload));
        }

        this.replyMessage = await this.message.reply(
            toMessageReplyOptions(payload),
        );

        return this.replyMessage;
    }

    public followUp(payload: CommandReplyPayload): Promise<Message> {
        return this.message.reply(toMessageReplyOptions(payload));
    }
}

export function createCommandResponder(
    source: CommandSource,
    logger: CommandLogger,
): CommandResponder {
    return source.kind === "interaction"
        ? new InteractionCommandResponder(source.raw)
        : new MessageCommandResponder(source.raw, logger);
}
