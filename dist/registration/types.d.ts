import type { ApplicationCommandType, REST, Snowflake } from "discord.js";
import type { SlashCommandPayload } from "../manager/slash";
/**
 * Determines how command definitions are written to a Discord command scope.
 */
export type SlashCommandRegistrationMode = "overwrite" | "upsert";
/** Registers commands globally for the application. */
export interface GlobalSlashCommandTarget {
    scope: "global";
}
/** Registers commands in one guild. */
export interface GuildSlashCommandTarget {
    scope: "guild";
    guildId: Snowflake;
}
/** Registers the same commands independently in multiple guilds. */
export interface GuildsSlashCommandTarget {
    scope: "guilds";
    guildIds: readonly Snowflake[];
}
/** A supported Discord application-command registration target. */
export type SlashCommandTarget = GlobalSlashCommandTarget | GuildSlashCommandTarget | GuildsSlashCommandTarget;
/**
 * Factory helpers for constructing registration targets.
 */
export declare const slashCommandTarget: {
    global(): GlobalSlashCommandTarget;
    guild(guildId: Snowflake): GuildSlashCommandTarget;
    guilds(guildIds: readonly Snowflake[]): GuildsSlashCommandTarget;
};
export type DiscordApiRoute = `/${string}`;
/**
 * Client used to send slash-command registration requests to Discord.
 *
 * Most users should provide either a bot token or an existing Discord.js
 * REST instance. This interface primarily exists for testing or custom
 * Discord API clients.
 */
export interface SlashCommandRegistrationClient {
    put(route: DiscordApiRoute, body: unknown): Promise<unknown>;
    post(route: DiscordApiRoute, body: unknown): Promise<unknown>;
}
interface BaseSlashCommandRegistrarConfig {
    /** Discord application ID that owns the commands. */
    applicationId: Snowflake;
}
/** Creates and owns a Discord.js REST client using the supplied token. */
export type TokenSlashCommandRegistrarConfig = BaseSlashCommandRegistrarConfig & {
    token: string;
    authPrefix?: "Bot" | "Bearer";
    rest?: never;
    transport?: never;
};
/** Reuses an existing Discord.js REST client, such as `client.rest`. */
export type RestSlashCommandRegistrarConfig = BaseSlashCommandRegistrarConfig & {
    rest: REST;
    token?: never;
    authPrefix?: never;
    transport?: never;
};
/** Uses an application-provided client implementation. */
export type CustomClientSlashCommandRegistrarConfig = BaseSlashCommandRegistrarConfig & {
    client: SlashCommandRegistrationClient;
    token?: never;
    authPrefix?: never;
    rest?: never;
};
/** Configuration accepted by {@link SlashCommandRegistrar}. */
export type SlashCommandRegistrarConfig = TokenSlashCommandRegistrarConfig | RestSlashCommandRegistrarConfig | CustomClientSlashCommandRegistrarConfig;
/** Options shared by registration operations. */
export interface SlashCommandRegistrationOptions {
    /**
     * `overwrite` replaces the complete Discord application-command scope and
     * removes every command omitted from the manifest, including context-menu
     * commands registered elsewhere. `upsert` creates or updates only the
     * supplied commands and leaves all other commands untouched.
     *
     * @defaultValue "overwrite"
     */
    mode?: SlashCommandRegistrationMode;
    /**
     * Maximum simultaneous command upserts within one scope.
     *
     * @defaultValue 4
     */
    commandConcurrency?: number;
    /**
     * Maximum number of guild scopes processed simultaneously by a multi-guild
     * registration.
     *
     * @defaultValue 3
     */
    guildConcurrency?: number;
}
/** Command returned by Discord after registration. */
export interface RegisteredSlashCommand {
    id: Snowflake;
    applicationId: Snowflake;
    guildId: Snowflake | null;
    name: string;
    type: ApplicationCommandType;
    version: Snowflake;
}
/** Result of registering commands in one Discord scope. */
export interface SlashCommandRegistrationResult {
    scope: "global" | "guild";
    guildId: Snowflake | null;
    mode: SlashCommandRegistrationMode;
    commands: readonly RegisteredSlashCommand[];
}
/** A failed guild entry in a multi-guild registration. */
export interface SlashCommandGuildRegistrationFailure {
    guildId: Snowflake;
    error: SlashCommandRegistrationError;
}
/**
 * Result of registering the same manifest in multiple guilds.
 *
 * All guilds are attempted. Inspect `ok` or `failed` before treating the batch
 * as successful.
 */
export interface SlashCommandGuildBatchResult {
    ok: boolean;
    mode: SlashCommandRegistrationMode;
    successful: readonly SlashCommandRegistrationResult[];
    failed: readonly SlashCommandGuildRegistrationFailure[];
}
/**
 * Error raised for a failed global or single-guild registration request.
 */
export declare class SlashCommandRegistrationError extends Error {
    readonly scope: "global" | "guild";
    readonly guildId: Snowflake | null;
    constructor(options: {
        scope: "global" | "guild";
        guildId: Snowflake | null;
        message: string;
        cause: unknown;
    });
}
/** Input accepted by registrar methods. */
export type SlashCommandManifest = readonly SlashCommandPayload[];
export {};
//# sourceMappingURL=types.d.ts.map