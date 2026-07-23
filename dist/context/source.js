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
export class CommandInvocation {
    source;
    raw;
    isInteraction;
    user;
    guild;
    resolvedMember;
    constructor(source) {
        this.source = source;
        this.raw = source.raw;
        this.isInteraction = source.kind === "interaction";
        this.guild = source.raw.guild;
        if (source.kind === "interaction") {
            this.user = source.raw.user;
            this.resolvedMember =
                source.raw.member instanceof GuildMember
                    ? source.raw.member
                    : (source.raw.guild?.members.resolve(source.raw.user.id) ??
                        null);
        }
        else {
            this.user = source.raw.author;
            this.resolvedMember = source.raw.member;
        }
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