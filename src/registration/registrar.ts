import {
    ApplicationCommandType,
    REST,
    Routes,
    type Snowflake,
} from "discord.js";
import type { SlashCommandPayload } from "../manager/slash";
import {
    type DiscordApiRoute,
    type GlobalSlashCommandTarget,
    type GuildSlashCommandTarget,
    type GuildsSlashCommandTarget,
    type RegisteredSlashCommand,
    type SlashCommandGuildBatchResult,
    type SlashCommandGuildRegistrationFailure,
    type SlashCommandManifest,
    type SlashCommandRegistrarConfig,
    type SlashCommandRegistrationClient,
    SlashCommandRegistrationError,
    type SlashCommandRegistrationMode,
    type SlashCommandRegistrationOptions,
    type SlashCommandRegistrationResult,
    type SlashCommandTarget,
} from "./types";

const DEFAULT_COMMAND_CONCURRENCY = 4;
const DEFAULT_GUILD_CONCURRENCY = 3;
const MAX_CONCURRENCY = 25;
const MAX_SLASH_COMMANDS_PER_SCOPE = 100;
const SNOWFLAKE_PATTERN = /^\d{1,20}$/u;

interface ResolvedRegistrationOptions {
    mode: SlashCommandRegistrationMode;
    commandConcurrency: number;
    guildConcurrency: number;
}

interface ParsedCommandResponse {
    id: Snowflake;
    applicationId: Snowflake;
    guildId: Snowflake | null;
    name: string;
    type: ApplicationCommandType;
    version: Snowflake;
}

class DiscordRestRegistrationClient implements SlashCommandRegistrationClient {
    public constructor(private readonly rest: REST) {}

    public put(route: DiscordApiRoute, body: unknown): Promise<unknown> {
        return this.rest.put(route, { body });
    }

    public post(route: DiscordApiRoute, body: unknown): Promise<unknown> {
        return this.rest.post(route, { body });
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(
    value: Record<string, unknown>,
    property: string,
): string | null {
    const candidate = value[property];

    return typeof candidate === "string" ? candidate : null;
}

function parseRegisteredCommand(
    value: unknown,
    fallbackGuildId: Snowflake | null,
): ParsedCommandResponse {
    if (!isRecord(value)) {
        throw new TypeError(
            "Discord returned an invalid application-command response.",
        );
    }

    const id = readString(value, "id");
    const applicationId = readString(value, "application_id");
    const responseGuildId = readString(value, "guild_id");
    const name = readString(value, "name");
    const version = readString(value, "version");
    const type = value.type;

    if (
        !id ||
        !applicationId ||
        !name ||
        !version ||
        typeof type !== "number"
    ) {
        throw new TypeError(
            "Discord returned an incomplete application-command response.",
        );
    }

    return {
        id,
        applicationId,
        guildId: responseGuildId ?? fallbackGuildId,
        name,
        type: type as ApplicationCommandType,
        version,
    };
}

function parseRegisteredCommandArray(
    value: unknown,
    fallbackGuildId: Snowflake | null,
): RegisteredSlashCommand[] {
    if (!Array.isArray(value)) {
        throw new TypeError(
            "Discord returned an invalid application-command collection.",
        );
    }

    return value.map((command) =>
        parseRegisteredCommand(command, fallbackGuildId),
    );
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function assertSnowflake(
    value: string,
    label: string,
): asserts value is Snowflake {
    if (!SNOWFLAKE_PATTERN.test(value)) {
        throw new TypeError(`${label} must be a valid Discord snowflake.`);
    }
}

function resolveConcurrency(
    value: number | undefined,
    fallback: number,
): number {
    const resolved = value ?? fallback;

    if (
        !Number.isSafeInteger(resolved) ||
        resolved < 1 ||
        resolved > MAX_CONCURRENCY
    ) {
        throw new RangeError(
            `Concurrency must be a whole number between 1 and ${MAX_CONCURRENCY}.`,
        );
    }

    return resolved;
}

function resolveRegistrationOptions(
    options: SlashCommandRegistrationOptions = {},
): ResolvedRegistrationOptions {
    return {
        mode: options.mode ?? "overwrite",
        commandConcurrency: resolveConcurrency(
            options.commandConcurrency,
            DEFAULT_COMMAND_CONCURRENCY,
        ),
        guildConcurrency: resolveConcurrency(
            options.guildConcurrency,
            DEFAULT_GUILD_CONCURRENCY,
        ),
    };
}

function validateManifest(
    commands: SlashCommandManifest,
): readonly SlashCommandPayload[] {
    if (commands.length > MAX_SLASH_COMMANDS_PER_SCOPE) {
        throw new RangeError(
            `A slash-command scope cannot contain more than ${MAX_SLASH_COMMANDS_PER_SCOPE} commands.`,
        );
    }

    const identities = new Set<string>();

    for (const command of commands) {
        const commandType = command.type ?? ApplicationCommandType.ChatInput;
        const identity = `${commandType}:${command.name}`;

        if (identities.has(identity)) {
            throw new Error(
                `Duplicate slash command "${command.name}" in registration manifest.`,
            );
        }

        identities.add(identity);
    }

    return [...commands];
}

function normalizeGuildIds(guildIds: readonly Snowflake[]): Snowflake[] {
    if (guildIds.length === 0) {
        throw new Error("At least one guild ID must be provided.");
    }

    const uniqueGuildIds: Snowflake[] = [];
    const seen = new Set<Snowflake>();

    for (const guildId of guildIds) {
        assertSnowflake(guildId, "Guild ID");

        if (!seen.has(guildId)) {
            seen.add(guildId);
            uniqueGuildIds.push(guildId);
        }
    }

    return uniqueGuildIds;
}

async function mapConcurrent<Input, Output>(
    values: readonly Input[],
    concurrency: number,
    mapper: (value: Input, index: number) => Promise<Output>,
): Promise<Output[]> {
    const results = new Array<Output>(values.length);
    let nextIndex = 0;

    const worker = async (): Promise<void> => {
        while (true) {
            const index = nextIndex;
            nextIndex++;

            if (index >= values.length) {
                return;
            }

            const value = values[index];

            if (value === undefined) {
                throw new Error("Concurrent mapper received an invalid index.");
            }

            results[index] = await mapper(value, index);
        }
    };

    const workerCount = Math.min(concurrency, values.length);

    await Promise.all(
        Array.from({ length: workerCount }, async () => worker()),
    );

    return results;
}

function createRegistrationClient(
    config: SlashCommandRegistrarConfig,
): SlashCommandRegistrationClient {
    if ("transport" in config && config.transport) {
        return config.transport;
    }

    if ("rest" in config && config.rest) {
        return new DiscordRestRegistrationClient(config.rest);
    }

    const token = config.token;

    if (typeof token !== "string" || token.trim().length === 0) {
        throw new TypeError("A non-empty Discord token must be provided.");
    }

    const rest = new REST({
        version: "10",
        authPrefix: config.authPrefix ?? "Bot",
    }).setToken(config.token);

    return new DiscordRestRegistrationClient(rest);
}

/**
 * Registers generated slash-command manifests with Discord.
 *
 * The registrar supports global, single-guild, and multi-guild scopes. Each
 * scope can either be atomically overwritten or incrementally upserted.
 */
export class SlashCommandRegistrar {
    private readonly applicationId: Snowflake;
    private readonly client: SlashCommandRegistrationClient;

    public constructor(config: SlashCommandRegistrarConfig) {
        assertSnowflake(config.applicationId, "Application ID");

        this.applicationId = config.applicationId;
        this.client = createRegistrationClient(config);
    }

    public register(
        commands: SlashCommandManifest,
        target: GlobalSlashCommandTarget,
        options?: SlashCommandRegistrationOptions,
    ): Promise<SlashCommandRegistrationResult>;

    public register(
        commands: SlashCommandManifest,
        target: GuildSlashCommandTarget,
        options?: SlashCommandRegistrationOptions,
    ): Promise<SlashCommandRegistrationResult>;

    public register(
        commands: SlashCommandManifest,
        target: GuildsSlashCommandTarget,
        options?: SlashCommandRegistrationOptions,
    ): Promise<SlashCommandGuildBatchResult>;

    public register(
        commands: SlashCommandManifest,
        target: SlashCommandTarget,
        options: SlashCommandRegistrationOptions = {},
    ):
        | Promise<SlashCommandRegistrationResult>
        | Promise<SlashCommandGuildBatchResult> {
        switch (target.scope) {
            case "global":
                return this.registerGlobal(commands, options);

            case "guild":
                return this.registerGuild(target.guildId, commands, options);

            case "guilds":
                return this.registerGuilds(target.guildIds, commands, options);
        }
    }

    /** Replaces or upserts global slash commands. */
    public registerGlobal(
        commands: SlashCommandManifest,
        options: SlashCommandRegistrationOptions = {},
    ): Promise<SlashCommandRegistrationResult> {
        const resolved = resolveRegistrationOptions(options);

        return this.registerScope(null, commands, resolved);
    }

    /** Replaces or upserts slash commands in one guild. */
    public registerGuild(
        guildId: Snowflake,
        commands: SlashCommandManifest,
        options: SlashCommandRegistrationOptions = {},
    ): Promise<SlashCommandRegistrationResult> {
        assertSnowflake(guildId, "Guild ID");

        const resolved = resolveRegistrationOptions(options);

        return this.registerScope(guildId, commands, resolved);
    }

    /**
     * Replaces or upserts the same slash commands in multiple guilds.
     *
     * Every guild is attempted. Individual failures are returned in `failed`
     * instead of aborting the remaining guild registrations.
     */
    public async registerGuilds(
        guildIds: readonly Snowflake[],
        commands: SlashCommandManifest,
        options: SlashCommandRegistrationOptions = {},
    ): Promise<SlashCommandGuildBatchResult> {
        const normalizedGuildIds = normalizeGuildIds(guildIds);
        const manifest = validateManifest(commands);
        const resolved = resolveRegistrationOptions(options);

        const outcomes = await mapConcurrent(
            normalizedGuildIds,
            resolved.guildConcurrency,
            async (guildId) => {
                try {
                    const result = await this.registerValidatedScope(
                        guildId,
                        manifest,
                        resolved,
                    );

                    return { success: true as const, result };
                } catch (error) {
                    const registrationError =
                        error instanceof SlashCommandRegistrationError
                            ? error
                            : this.createRegistrationError(guildId, error);

                    return {
                        success: false as const,
                        guildId,
                        error: registrationError,
                    };
                }
            },
        );

        const successful: SlashCommandRegistrationResult[] = [];
        const failed: SlashCommandGuildRegistrationFailure[] = [];

        for (const outcome of outcomes) {
            if (outcome.success) {
                successful.push(outcome.result);
            } else {
                failed.push({
                    guildId: outcome.guildId,
                    error: outcome.error,
                });
            }
        }

        return {
            ok: failed.length === 0,
            mode: resolved.mode,
            successful,
            failed,
        };
    }

    /** Atomically replaces all global commands, removing stale commands. */
    public overwriteGlobal(
        commands: SlashCommandManifest,
    ): Promise<SlashCommandRegistrationResult> {
        return this.registerGlobal(commands, { mode: "overwrite" });
    }

    /** Creates or updates global commands without removing other commands. */
    public upsertGlobal(
        commands: SlashCommandManifest,
        options: Omit<SlashCommandRegistrationOptions, "mode"> = {},
    ): Promise<SlashCommandRegistrationResult> {
        return this.registerGlobal(commands, {
            ...options,
            mode: "upsert",
        });
    }

    /** Atomically replaces all commands in one guild. */
    public overwriteGuild(
        guildId: Snowflake,
        commands: SlashCommandManifest,
    ): Promise<SlashCommandRegistrationResult> {
        return this.registerGuild(guildId, commands, {
            mode: "overwrite",
        });
    }

    /** Creates or updates commands in one guild without removing others. */
    public upsertGuild(
        guildId: Snowflake,
        commands: SlashCommandManifest,
        options: Omit<SlashCommandRegistrationOptions, "mode"> = {},
    ): Promise<SlashCommandRegistrationResult> {
        return this.registerGuild(guildId, commands, {
            ...options,
            mode: "upsert",
        });
    }

    /** Atomically replaces all commands in each supplied guild. */
    public overwriteGuilds(
        guildIds: readonly Snowflake[],
        commands: SlashCommandManifest,
        options: Omit<SlashCommandRegistrationOptions, "mode"> = {},
    ): Promise<SlashCommandGuildBatchResult> {
        return this.registerGuilds(guildIds, commands, {
            ...options,
            mode: "overwrite",
        });
    }

    /** Upserts commands independently in each supplied guild. */
    public upsertGuilds(
        guildIds: readonly Snowflake[],
        commands: SlashCommandManifest,
        options: Omit<SlashCommandRegistrationOptions, "mode"> = {},
    ): Promise<SlashCommandGuildBatchResult> {
        return this.registerGuilds(guildIds, commands, {
            ...options,
            mode: "upsert",
        });
    }

    /** Removes every global application command from the global scope. */
    public clearGlobal(): Promise<SlashCommandRegistrationResult> {
        return this.overwriteGlobal([]);
    }

    /** Removes every application command from one guild scope. */
    public clearGuild(
        guildId: Snowflake,
    ): Promise<SlashCommandRegistrationResult> {
        return this.overwriteGuild(guildId, []);
    }

    /** Removes every application command from each supplied guild scope. */
    public clearGuilds(
        guildIds: readonly Snowflake[],
        options: Pick<SlashCommandRegistrationOptions, "guildConcurrency"> = {},
    ): Promise<SlashCommandGuildBatchResult> {
        return this.overwriteGuilds(guildIds, [], options);
    }

    private registerScope(
        guildId: Snowflake | null,
        commands: SlashCommandManifest,
        options: ResolvedRegistrationOptions,
    ): Promise<SlashCommandRegistrationResult> {
        return this.registerValidatedScope(
            guildId,
            validateManifest(commands),
            options,
        );
    }

    private async registerValidatedScope(
        guildId: Snowflake | null,
        commands: readonly SlashCommandPayload[],
        options: ResolvedRegistrationOptions,
    ): Promise<SlashCommandRegistrationResult> {
        try {
            const registeredCommands =
                options.mode === "overwrite"
                    ? await this.overwriteScope(guildId, commands)
                    : await this.upsertScope(
                          guildId,
                          commands,
                          options.commandConcurrency,
                      );

            return {
                scope: guildId === null ? "global" : "guild",
                guildId,
                mode: options.mode,
                commands: registeredCommands,
            };
        } catch (error) {
            throw this.createRegistrationError(guildId, error);
        }
    }

    private async overwriteScope(
        guildId: Snowflake | null,
        commands: SlashCommandManifest,
    ): Promise<RegisteredSlashCommand[]> {
        const response = await this.client.put(
            this.getCollectionRoute(guildId),
            [...commands],
        );

        return parseRegisteredCommandArray(response, guildId);
    }

    private async upsertScope(
        guildId: Snowflake | null,
        commands: SlashCommandManifest,
        concurrency: number,
    ): Promise<RegisteredSlashCommand[]> {
        return mapConcurrent(commands, concurrency, async (command) => {
            const response = await this.client.post(
                this.getCollectionRoute(guildId),
                command,
            );

            return parseRegisteredCommand(response, guildId);
        });
    }

    private getCollectionRoute(guildId: Snowflake | null): DiscordApiRoute {
        return guildId === null
            ? Routes.applicationCommands(this.applicationId)
            : Routes.applicationGuildCommands(this.applicationId, guildId);
    }

    private createRegistrationError(
        guildId: Snowflake | null,
        cause: unknown,
    ): SlashCommandRegistrationError {
        const scopeDescription =
            guildId === null ? "global scope" : `guild ${guildId}`;

        return new SlashCommandRegistrationError({
            scope: guildId === null ? "global" : "guild",
            guildId,
            message:
                `Failed to register slash commands in ${scopeDescription}: ` +
                getErrorMessage(cause),
            cause,
        });
    }
}
