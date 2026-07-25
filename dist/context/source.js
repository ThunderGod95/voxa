import { GuildMember, } from "discord.js";
export function createCommandSource(payload) {
    return "author" in payload
        ? {
            kind: "message",
            raw: payload,
        }
        : {
            kind: "interaction",
            raw: payload,
        };
}
/**
 * Normalizes message and interaction command payloads into a shared shape.
 *
 * @internal
 */
export class CommandInvocation {
    source;
    kind;
    raw;
    isInteraction;
    isMessage;
    client;
    id;
    user;
    userId;
    channel;
    channelId;
    guild;
    guildId;
    createdAt;
    createdTimestamp;
    locale;
    guildLocale;
    resolvedMember;
    constructor(source) {
        this.source = source;
        this.kind = source.kind;
        this.raw = source.raw;
        this.isInteraction = source.kind === "interaction";
        this.isMessage = source.kind === "message";
        this.client = source.raw.client;
        this.id = source.raw.id;
        this.channel = source.raw.channel;
        this.channelId = source.raw.channelId;
        this.guild = source.raw.guild;
        this.guildId = source.raw.guildId;
        this.createdAt = source.raw.createdAt;
        this.createdTimestamp = source.raw.createdTimestamp;
        if (source.kind === "interaction") {
            this.user = source.raw.user;
            this.locale = source.raw.locale;
            this.guildLocale = source.raw.guildLocale;
            this.resolvedMember =
                source.raw.member instanceof GuildMember
                    ? source.raw.member
                    : (source.raw.guild?.members.resolve(source.raw.user.id) ??
                        null);
        }
        else {
            this.user = source.raw.author;
            this.locale = null;
            this.guildLocale = source.raw.guild?.preferredLocale ?? null;
            this.resolvedMember = source.raw.member;
        }
        this.userId = this.user.id;
    }
    get interaction() {
        return this.source.kind === "interaction" ? this.source.raw : null;
    }
    get message() {
        return this.source.kind === "message" ? this.source.raw : null;
    }
    get member() {
        return this.resolvedMember;
    }
    async fetchMember() {
        if (this.resolvedMember) {
            return this.resolvedMember;
        }
        if (!this.guild) {
            return null;
        }
        this.resolvedMember = await this.guild.members
            .fetch(this.user.id)
            .catch(() => null);
        return this.resolvedMember;
    }
}
//# sourceMappingURL=source.js.map