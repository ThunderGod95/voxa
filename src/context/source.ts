import {
    type ChatInputCommandInteraction,
    type Guild,
    GuildMember,
    type Message,
    type User,
} from "discord.js";

export type CommandPayload = ChatInputCommandInteraction | Message;

export type CommandSource =
    | {
          kind: "interaction";
          raw: ChatInputCommandInteraction;
      }
    | {
          kind: "message";
          raw: Message;
      };

export function createCommandSource(payload: CommandPayload): CommandSource {
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
    public readonly raw: CommandPayload;
    public readonly isInteraction: boolean;
    public readonly user: User;
    public readonly guild: Guild | null;

    private resolvedMember: GuildMember | null;

    public constructor(public readonly source: CommandSource) {
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
        } else {
            this.user = source.raw.author;
            this.resolvedMember = source.raw.member;
        }
    }

    public get interaction(): ChatInputCommandInteraction | null {
        return this.source.kind === "interaction" ? this.source.raw : null;
    }

    public get message(): Message | null {
        return this.source.kind === "message" ? this.source.raw : null;
    }

    public get member(): GuildMember | null {
        return this.resolvedMember;
    }

    public async fetchMember(): Promise<GuildMember | null> {
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
