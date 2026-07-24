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

/**
 * Identifies how a command was invoked.
 */
export type CommandInvocationKind = CommandSource["kind"];

/**
 * Discord client associated with a command invocation.
 */
export type CommandClient = CommandPayload["client"];

/**
 * Channel associated with a command invocation.
 *
 * Interaction channels may be unavailable when Discord.js cannot resolve
 * the channel from its cache.
 */
export type CommandChannel = CommandPayload["channel"];

/**
 * Discord locale associated with an interaction.
 */
export type CommandLocale = ChatInputCommandInteraction["locale"];

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

/**
 * Normalizes message and interaction command payloads into a shared shape.
 *
 * @internal
 */
export class CommandInvocation {
    public readonly kind: CommandInvocationKind;
    public readonly raw: CommandPayload;

    public readonly isInteraction: boolean;
    public readonly isMessage: boolean;

    public readonly client: CommandClient;

    public readonly id: string;

    public readonly user: User;
    public readonly userId: string;

    public readonly channel: CommandChannel;
    public readonly channelId: string;

    public readonly guild: Guild | null;
    public readonly guildId: string | null;

    public readonly createdAt: Date;
    public readonly createdTimestamp: number;

    public readonly locale: CommandLocale | null;
    public readonly guildLocale: CommandLocale | null;

    private resolvedMember: GuildMember | null;

    public constructor(public readonly source: CommandSource) {
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
        } else {
            this.user = source.raw.author;
            this.locale = null;
            this.guildLocale = source.raw.guild?.preferredLocale ?? null;
            this.resolvedMember = source.raw.member;
        }

        this.userId = this.user.id;
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
