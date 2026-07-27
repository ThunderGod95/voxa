import { defaultCommandFeedbackRenderer, } from "./feedback";
import { defaultCommandLogger } from "./logger";
import { createCommandResponder } from "./responder";
import { CommandInvocation, createCommandSource, } from "./source";
/**
 * Shared execution context provided to message and interaction commands.
 */
export class CommandContext {
    /**
     * Arguments parsed and validated against the command's argument schema.
     */
    args;
    /**
     * User IDs configured as bot developers.
     */
    devIds;
    invocation;
    responder;
    feedbackRenderer;
    constructor(payload, args, options = {}) {
        const logger = options.logger ?? defaultCommandLogger;
        const source = createCommandSource(payload);
        this.args = args;
        this.devIds = options.devIds ?? [];
        this.invocation = new CommandInvocation(source);
        this.responder = createCommandResponder(source, logger);
        this.feedbackRenderer =
            options.feedbackRenderer ?? defaultCommandFeedbackRenderer;
    }
    /**
     * Original Discord.js message or interaction.
     */
    get raw() {
        return this.invocation.raw;
    }
    /**
     * How the command was invoked.
     */
    get kind() {
        return this.invocation.kind;
    }
    /**
     * Whether the command was invoked through an application command.
     */
    get isInteraction() {
        return this.invocation.isInteraction;
    }
    /**
     * Whether the command was invoked through a Discord message.
     */
    get isMessage() {
        return this.invocation.isMessage;
    }
    /**
     * Discord client that received the invocation.
     */
    get client() {
        return this.invocation.client;
    }
    /**
     * ID of the underlying message or interaction.
     */
    get id() {
        return this.invocation.id;
    }
    /**
     * Interaction that invoked the command, or null for message commands.
     */
    get interaction() {
        return this.invocation.interaction;
    }
    /**
     * Message that invoked the command, or null for interaction commands.
     */
    get message() {
        return this.invocation.message;
    }
    /**
     * User who invoked the command.
     */
    get user() {
        return this.invocation.user;
    }
    /**
     * ID of the user who invoked the command.
     */
    get userId() {
        return this.invocation.userId;
    }
    /**
     * Channel in which the command was invoked.
     *
     * This can be null when Discord.js cannot resolve an interaction channel.
     */
    get channel() {
        return this.invocation.channel;
    }
    /**
     * ID of the channel in which the command was invoked.
     */
    get channelId() {
        return this.invocation.channelId;
    }
    /**
     * Guild in which the command was invoked.
     *
     * Throws when accessed for a direct-message invocation. DM-aware commands
     * should use guildOrNull or isGuild first.
     */
    get guild() {
        const guild = this.invocation.guild;
        if (!guild) {
            throw new Error("This command was not invoked in a guild.");
        }
        return guild;
    }
    /**
     * Guild in which the command was invoked, or null in direct messages.
     */
    get guildOrNull() {
        return this.invocation.guild;
    }
    /**
     * ID of the invocation guild, or null in direct messages.
     *
     * This remains available even when the complete guild object is not needed.
     */
    get guildId() {
        return this.invocation.guildId;
    }
    /**
     * Whether the command was invoked inside a guild.
     */
    get isGuild() {
        return this.invocation.guild !== null;
    }
    /**
     * Cached guild member associated with the invoking user.
     *
     * Use fetchMember() when the member is not already available.
     */
    get member() {
        return this.invocation.member;
    }
    /**
     * Returns the invoking guild member, fetching it when necessary.
     */
    fetchMember() {
        return this.invocation.fetchMember();
    }
    /**
     * Time at which the underlying message or interaction was created.
     */
    get createdAt() {
        return this.invocation.createdAt;
    }
    /**
     * Unix timestamp, in milliseconds, at which the invocation was created.
     */
    get createdTimestamp() {
        return this.invocation.createdTimestamp;
    }
    /**
     * User locale supplied by Discord for interaction commands.
     *
     * Message commands do not contain user locale information.
     */
    get locale() {
        return this.invocation.locale;
    }
    /**
     * Preferred locale of the invocation guild.
     *
     * For interactions, this uses Discord's interaction locale payload. For
     * message commands, it uses the resolved guild's preferred locale.
     */
    get guildLocale() {
        return this.invocation.guildLocale;
    }
    deferReply(ephemeral = false) {
        return this.responder.deferReply(ephemeral);
    }
    editReply(payload) {
        return this.responder.editReply(payload);
    }
    reply(payload) {
        return this.responder.editReply(payload);
    }
    followUp(payload) {
        return this.responder.followUp(payload);
    }
    /**
     * Shows a modal as the initial response to an interaction.
     *
     * Throws for message commands or when the interaction has already been
     * acknowledged.
     */
    showModal(modal) {
        return this.responder.showModal(modal);
    }
    replyError(message) {
        return this.reply(this.feedbackRenderer.error(message));
    }
    replySuccess(message) {
        return this.reply(this.feedbackRenderer.success(message));
    }
}
//# sourceMappingURL=context.js.map