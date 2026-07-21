import { describe, expect, mock, test } from "bun:test";
import {
    type ChatInputCommandInteraction,
    type Guild,
    type GuildMember,
    type InteractionDeferReplyOptions,
    type InteractionEditReplyOptions,
    type InteractionReplyOptions,
    type Message,
    type MessageEditOptions,
    MessageFlags,
    type MessageReplyOptions,
    TextDisplayBuilder,
} from "discord.js";
import {
    CommandContext,
    type CommandFeedbackRenderer,
    type CommandLogger,
    createComponentFeedbackRenderer,
    createPlainTextFeedbackRenderer,
    toInteractionEditReplyOptions,
    toInteractionReplyOptions,
    toMessageEditOptions,
    toMessageReplyOptions,
} from "@/context";

function createReplyMessage(id = "reply-1") {
    let message: Message;

    const edit = mock(async (_payload: MessageEditOptions) => message);

    message = {
        id,
        edit,
    } as unknown as Message;

    return { message, edit };
}

interface MockInteractionOptions {
    deferred?: boolean;
    replied?: boolean;
    guild?: Guild | null;
    member?: GuildMember | null;
    userId?: string;
}

function createInteraction(options: MockInteractionOptions = {}) {
    const initialReply = createReplyMessage("initial-reply");
    const editedReply = createReplyMessage("edited-reply");
    const followUpReply = createReplyMessage("follow-up-reply");

    const deferReply = mock(
        async (_payload?: InteractionDeferReplyOptions) => undefined,
    );

    const reply = mock(async (_payload: InteractionReplyOptions) => undefined);

    const fetchReply = mock(async () => initialReply.message);

    const editReply = mock(
        async (_payload: InteractionEditReplyOptions) => editedReply.message,
    );

    const followUp = mock(
        async (_payload: InteractionReplyOptions) => followUpReply.message,
    );

    const interaction = {
        user: {
            id: options.userId ?? "user-1",
            bot: false,
        },
        guild: options.guild ?? null,
        member: options.member ?? null,
        channel: null,
        deferred: options.deferred ?? false,
        replied: options.replied ?? false,
        deferReply,
        reply,
        fetchReply,
        editReply,
        followUp,
    } as unknown as ChatInputCommandInteraction;

    return {
        interaction,
        deferReply,
        reply,
        fetchReply,
        editReply,
        followUp,
        initialReply: initialReply.message,
        editedReply: editedReply.message,
        followUpReply: followUpReply.message,
    };
}

interface MockMessageOptions {
    guild?: Guild | null;
    member?: GuildMember | null;
    userId?: string;
    sendTyping?: () => Promise<unknown>;
}

function createMessage(options: MockMessageOptions = {}) {
    const firstReply = createReplyMessage("message-reply");

    const sendTyping = options.sendTyping ?? mock(async () => undefined);

    const reply = mock(
        async (_payload: MessageReplyOptions) => firstReply.message,
    );

    const message = {
        author: {
            id: options.userId ?? "user-1",
            bot: false,
        },
        guild: options.guild ?? null,
        member: options.member ?? null,
        channel: {
            id: "channel-1",
            sendTyping,
        },
        reply,
    } as unknown as Message;

    return {
        message,
        reply,
        sendTyping,
        replyMessage: firstReply.message,
        editReplyMessage: firstReply.edit,
    };
}

function createLogger(): CommandLogger & {
    error: ReturnType<typeof mock>;
    warn: ReturnType<typeof mock>;
} {
    return {
        error: mock(() => undefined),
        warn: mock(() => undefined),
    };
}

describe("reply payload normalization", () => {
    test("normalizes string payloads for interaction replies", () => {
        const result = toInteractionReplyOptions("hello");

        expect(result).toEqual({
            allowedMentions: undefined,
            content: "hello",
            embeds: undefined,
            flags: undefined,
        });
    });

    test("maps mentions to allowedMentions", () => {
        const mentions = { parse: [] } as const;

        const result = toInteractionReplyOptions({
            content: "hello",
            mentions,
        });

        expect(result.allowedMentions).toEqual(mentions);
    });

    test("adds ephemeral and Components V2 flags to interaction replies", () => {
        const component = new TextDisplayBuilder({
            content: "hello",
        });

        const result = toInteractionReplyOptions({
            components: [component],
            ephemeral: true,
        });

        expect(result.flags).toBe(
            MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        );

        expect(result.components).toEqual([component]);
    });

    test("does not apply ephemeral to interaction edits", () => {
        const component = new TextDisplayBuilder({
            content: "hello",
        });

        const result = toInteractionEditReplyOptions({
            components: [component],
            ephemeral: true,
        });

        expect(result.flags).toBe(MessageFlags.IsComponentsV2);
    });

    test("does not apply ephemeral to message replies", () => {
        const result = toMessageReplyOptions({
            content: "hello",
            ephemeral: true,
        });

        expect(result.flags).toBeUndefined();
        expect(result.content).toBe("hello");
    });

    test("applies Components V2 flags to message replies and edits", () => {
        const component = new TextDisplayBuilder({
            content: "hello",
        });

        const payload = {
            components: [component],
        } as const;

        expect(toMessageReplyOptions(payload).flags).toBe(
            MessageFlags.IsComponentsV2,
        );

        expect(toMessageEditOptions(payload).flags).toBe(
            MessageFlags.IsComponentsV2,
        );
    });
});

describe("feedback renderers", () => {
    test("plain text renderer uses custom prefixes", () => {
        const renderer = createPlainTextFeedbackRenderer({
            errorPrefix: "ERR:",
            successPrefix: "OK:",
        });

        expect(renderer.error("failed")).toBe("ERR: failed");

        expect(renderer.success("worked")).toBe("OK: worked");
    });

    test("component renderer creates one Components V2 container", () => {
        const renderer = createComponentFeedbackRenderer({
            errorPrefix: "ERROR",
            errorAccentColor: 0x123456,
        });

        const payload = renderer.error("failed");

        expect(typeof payload).not.toBe("string");

        if (typeof payload !== "string") {
            expect(payload.components).toHaveLength(1);
            expect(payload.content).toBeUndefined();
            expect(payload.embeds).toBeUndefined();
        }
    });
});

describe("CommandContext invocation data", () => {
    test("exposes interaction properties without instanceof mocking", () => {
        const { interaction } = createInteraction({
            userId: "interaction-user",
        });

        const ctx = new CommandContext(interaction, {
            query: "hello",
        });

        expect(ctx.raw).toBe(interaction);
        expect(ctx.isInteraction).toBe(true);
        expect(ctx.interaction).toBe(interaction);
        expect(ctx.message).toBeNull();
        expect(ctx.user.id).toBe("interaction-user");
        expect(ctx.guild).toBeNull();
        expect(ctx.member).toBeNull();
        expect(ctx.args).toEqual({ query: "hello" });
    });

    test("exposes message properties", () => {
        const { message } = createMessage({
            userId: "message-user",
        });

        const ctx = new CommandContext(message, {
            count: 2,
        });

        expect(ctx.raw).toBe(message);
        expect(ctx.isInteraction).toBe(false);
        expect(ctx.interaction).toBeNull();
        expect(ctx.message).toBe(message);
        expect(ctx.user.id).toBe("message-user");
        expect(ctx.args).toEqual({ count: 2 });
    });

    test("resolves an interaction member from the guild cache", () => {
        const member = {
            id: "member-1",
        } as unknown as GuildMember;

        const resolve = mock(() => member);

        const guild = {
            members: { resolve },
        } as unknown as Guild;

        const { interaction } = createInteraction({ guild });

        const ctx = new CommandContext(interaction, {});

        expect(resolve).toHaveBeenCalledWith("user-1");
        expect(ctx.member).toBe(member);
    });

    test("returns an already resolved member without fetching", async () => {
        const member = {
            id: "member-1",
        } as unknown as GuildMember;

        const fetch = mock(async () => member);

        const guild = {
            members: { fetch },
        } as unknown as Guild;

        const { message } = createMessage({
            guild,
            member,
        });

        const ctx = new CommandContext(message, {});

        expect(await ctx.fetchMember()).toBe(member);
        expect(fetch).not.toHaveBeenCalled();
    });

    test("fetches and caches an unresolved member", async () => {
        const member = {
            id: "member-1",
        } as unknown as GuildMember;

        const fetch = mock(async () => member);

        const guild = {
            members: { fetch },
        } as unknown as Guild;

        const { message } = createMessage({
            guild,
            member: null,
        });

        const ctx = new CommandContext(message, {});

        expect(await ctx.fetchMember()).toBe(member);
        expect(await ctx.fetchMember()).toBe(member);

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith("user-1");
    });

    test("returns null when member fetching fails", async () => {
        const fetch = mock(async () => {
            throw new Error("not found");
        });

        const guild = {
            members: { fetch },
        } as unknown as Guild;

        const { message } = createMessage({
            guild,
            member: null,
        });

        const ctx = new CommandContext(message, {});

        expect(await ctx.fetchMember()).toBeNull();
    });

    test("returns null when fetching a member outside a guild", async () => {
        const { message } = createMessage({
            guild: null,
            member: null,
        });

        const ctx = new CommandContext(message, {});

        expect(await ctx.fetchMember()).toBeNull();
    });
});

describe("CommandContext interaction responses", () => {
    test("defers an ephemeral interaction reply", async () => {
        const { interaction, deferReply } = createInteraction();

        const ctx = new CommandContext(interaction, {});

        await ctx.deferReply(true);

        expect(deferReply).toHaveBeenCalledWith({
            flags: MessageFlags.Ephemeral,
        });
    });

    test("does not defer an already deferred interaction", async () => {
        const { interaction, deferReply } = createInteraction({
            deferred: true,
        });

        const ctx = new CommandContext(interaction, {});

        await ctx.deferReply();

        expect(deferReply).not.toHaveBeenCalled();
    });

    test("does not defer an already replied interaction", async () => {
        const { interaction, deferReply } = createInteraction({
            replied: true,
        });

        const ctx = new CommandContext(interaction, {});

        await ctx.deferReply();

        expect(deferReply).not.toHaveBeenCalled();
    });

    test("sends and fetches the initial interaction reply", async () => {
        const { interaction, reply, fetchReply, initialReply } =
            createInteraction();

        const ctx = new CommandContext(interaction, {});

        const result = await ctx.reply("hello");

        expect(reply).toHaveBeenCalledWith(
            expect.objectContaining({
                content: "hello",
            }),
        );

        expect(fetchReply).toHaveBeenCalledTimes(1);
        expect(result).toBe(initialReply);
    });

    test("edits a deferred interaction reply", async () => {
        const { interaction, reply, editReply, editedReply } =
            createInteraction({
                deferred: true,
            });

        const ctx = new CommandContext(interaction, {});

        const result = await ctx.editReply("updated");

        expect(reply).not.toHaveBeenCalled();

        expect(editReply).toHaveBeenCalledWith(
            expect.objectContaining({
                content: "updated",
            }),
        );

        expect(result).toBe(editedReply);
    });

    test("uses the initial reply path for a first follow-up", async () => {
        const { interaction, reply, followUp, initialReply } =
            createInteraction();

        const ctx = new CommandContext(interaction, {});

        const result = await ctx.followUp("hello");

        expect(reply).toHaveBeenCalledTimes(1);
        expect(followUp).not.toHaveBeenCalled();
        expect(result).toBe(initialReply);
    });

    test("uses interaction.followUp after an existing response", async () => {
        const { interaction, reply, followUp, followUpReply } =
            createInteraction({
                replied: true,
            });

        const ctx = new CommandContext(interaction, {});

        const result = await ctx.followUp("another");

        expect(reply).not.toHaveBeenCalled();

        expect(followUp).toHaveBeenCalledWith(
            expect.objectContaining({
                content: "another",
            }),
        );

        expect(result).toBe(followUpReply);
    });
});

describe("CommandContext message responses", () => {
    test("sends a typing indicator when deferring", async () => {
        const { message, sendTyping } = createMessage();

        const ctx = new CommandContext(message, {});

        await ctx.deferReply();

        expect(sendTyping).toHaveBeenCalledTimes(1);
    });

    test("logs typing indicator failures without throwing", async () => {
        const sendTyping = mock(async () => {
            throw new Error("typing failed");
        });

        const logger = createLogger();

        const { message } = createMessage({
            sendTyping,
        });

        const ctx = new CommandContext(message, {}, { logger });

        await expect(ctx.deferReply()).resolves.toBeUndefined();

        expect(logger.warn).toHaveBeenCalledWith(
            "Failed to send a typing indicator in channel channel-1: typing failed",
        );
    });

    test("creates the first message reply", async () => {
        const { message, reply, replyMessage } = createMessage();

        const ctx = new CommandContext(message, {});

        const result = await ctx.reply("hello");

        expect(reply).toHaveBeenCalledWith(
            expect.objectContaining({
                content: "hello",
            }),
        );

        expect(result).toBe(replyMessage);
    });

    test("edits the stored reply on subsequent reply calls", async () => {
        const { message, reply, editReplyMessage, replyMessage } =
            createMessage();

        const ctx = new CommandContext(message, {});

        await ctx.reply("first");

        const result = await ctx.reply("second");

        expect(reply).toHaveBeenCalledTimes(1);

        expect(editReplyMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                content: "second",
            }),
        );

        expect(result).toBe(replyMessage);
    });

    test("always creates a new message for follow-ups", async () => {
        const { message, reply, editReplyMessage } = createMessage();

        const ctx = new CommandContext(message, {});

        await ctx.reply("first");
        await ctx.followUp("second");

        expect(reply).toHaveBeenCalledTimes(2);
        expect(editReplyMessage).not.toHaveBeenCalled();
    });

    test("uses the configured feedback renderer", async () => {
        const error = mock((message: string) => `ERR: ${message}`);

        const success = mock((message: string) => `OK: ${message}`);

        const feedbackRenderer: CommandFeedbackRenderer = {
            error,
            success,
        };

        const { message, reply, editReplyMessage } = createMessage();

        const ctx = new CommandContext(message, {}, { feedbackRenderer });

        await ctx.replyError("failed");
        await ctx.replySuccess("worked");

        expect(error).toHaveBeenCalledWith("failed");
        expect(success).toHaveBeenCalledWith("worked");

        expect(reply).toHaveBeenCalledWith(
            expect.objectContaining({
                content: "ERR: failed",
            }),
        );

        expect(editReplyMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                content: "OK: worked",
            }),
        );
    });
});
