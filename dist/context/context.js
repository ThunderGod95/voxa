import { defaultCommandFeedbackRenderer, } from "./feedback";
import { defaultCommandLogger } from "./logger";
import { createCommandResponder } from "./responder";
import { CommandInvocation, createCommandSource, } from "./source";
export class CommandContext {
    args;
    invocation;
    responder;
    feedbackRenderer;
    constructor(payload, args, options = {}) {
        const logger = options.logger ?? defaultCommandLogger;
        const source = createCommandSource(payload);
        this.args = args;
        this.invocation = new CommandInvocation(source);
        this.responder = createCommandResponder(source, logger);
        this.feedbackRenderer =
            options.feedbackRenderer ?? defaultCommandFeedbackRenderer;
    }
    get raw() {
        return this.invocation.raw;
    }
    get isInteraction() {
        return this.invocation.isInteraction;
    }
    get interaction() {
        return this.invocation.interaction;
    }
    get message() {
        return this.invocation.message;
    }
    get user() {
        return this.invocation.user;
    }
    get guild() {
        return this.invocation.guild;
    }
    get member() {
        return this.invocation.member;
    }
    fetchMember() {
        return this.invocation.fetchMember();
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
    replyError(message) {
        return this.reply(this.feedbackRenderer.error(message));
    }
    replySuccess(message) {
        return this.reply(this.feedbackRenderer.success(message));
    }
}
//# sourceMappingURL=context.js.map