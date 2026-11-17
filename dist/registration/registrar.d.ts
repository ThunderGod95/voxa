import { type Snowflake } from "discord.js";
import { type GlobalSlashCommandTarget, type GuildSlashCommandTarget, type GuildsSlashCommandTarget, type SlashCommandGuildBatchResult, type SlashCommandManifest, type SlashCommandRegistrarConfig, type SlashCommandRegistrationOptions, type SlashCommandRegistrationResult } from "./types";
/**
 * Registers generated slash-command manifests with Discord.
 *
 * The registrar supports global, single-guild, and multi-guild scopes. Each
 * scope can either be atomically overwritten or incrementally upserted.
 */
export declare class SlashCommandRegistrar {
    private readonly applicationId;
    private readonly client;
    constructor(config: SlashCommandRegistrarConfig);
    register(commands: SlashCommandManifest, target: GlobalSlashCommandTarget, options?: SlashCommandRegistrationOptions): Promise<SlashCommandRegistrationResult>;
    register(commands: SlashCommandManifest, target: GuildSlashCommandTarget, options?: SlashCommandRegistrationOptions): Promise<SlashCommandRegistrationResult>;
    register(commands: SlashCommandManifest, target: GuildsSlashCommandTarget, options?: SlashCommandRegistrationOptions): Promise<SlashCommandGuildBatchResult>;
    /** Replaces or upserts global slash commands. */
    registerGlobal(commands: SlashCommandManifest, options?: SlashCommandRegistrationOptions): Promise<SlashCommandRegistrationResult>;
    /** Replaces or upserts slash commands in one guild. */
    registerGuild(guildId: Snowflake, commands: SlashCommandManifest, options?: SlashCommandRegistrationOptions): Promise<SlashCommandRegistrationResult>;
    /**
     * Replaces or upserts the same slash commands in multiple guilds.
     *
     * Every guild is attempted. Individual failures are returned in `failed`
     * instead of aborting the remaining guild registrations.
     */
    registerGuilds(guildIds: readonly Snowflake[], commands: SlashCommandManifest, options?: SlashCommandRegistrationOptions): Promise<SlashCommandGuildBatchResult>;
    /** Atomically replaces all global commands, removing stale commands. */
    overwriteGlobal(commands: SlashCommandManifest): Promise<SlashCommandRegistrationResult>;
    /** Creates or updates global commands without removing other commands. */
    upsertGlobal(commands: SlashCommandManifest, options?: Omit<SlashCommandRegistrationOptions, "mode">): Promise<SlashCommandRegistrationResult>;
    /** Atomically replaces all commands in one guild. */
    overwriteGuild(guildId: Snowflake, commands: SlashCommandManifest): Promise<SlashCommandRegistrationResult>;
    /** Creates or updates commands in one guild without removing others. */
    upsertGuild(guildId: Snowflake, commands: SlashCommandManifest, options?: Omit<SlashCommandRegistrationOptions, "mode">): Promise<SlashCommandRegistrationResult>;
    /** Atomically replaces all commands in each supplied guild. */
    overwriteGuilds(guildIds: readonly Snowflake[], commands: SlashCommandManifest, options?: Omit<SlashCommandRegistrationOptions, "mode">): Promise<SlashCommandGuildBatchResult>;
    /** Upserts commands independently in each supplied guild. */
    upsertGuilds(guildIds: readonly Snowflake[], commands: SlashCommandManifest, options?: Omit<SlashCommandRegistrationOptions, "mode">): Promise<SlashCommandGuildBatchResult>;
    /** Removes every global application command from the global scope. */
    clearGlobal(): Promise<SlashCommandRegistrationResult>;
    /** Removes every application command from one guild scope. */
    clearGuild(guildId: Snowflake): Promise<SlashCommandRegistrationResult>;
    /** Removes every application command from each supplied guild scope. */
    clearGuilds(guildIds: readonly Snowflake[], options?: Pick<SlashCommandRegistrationOptions, "guildConcurrency">): Promise<SlashCommandGuildBatchResult>;
    private registerScope;
    private registerValidatedScope;
    private overwriteScope;
    private upsertScope;
    private getCollectionRoute;
    private createRegistrationError;
}
//# sourceMappingURL=registrar.d.ts.map