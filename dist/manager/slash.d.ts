import { SlashCommandBuilder } from "discord.js";
import { type AnyCommand } from "./command";
import { type CommandRoute } from "./route";
/** JSON payload produced for Discord slash-command registration. */
export type SlashCommandPayload = ReturnType<SlashCommandBuilder["toJSON"]>;
/**
 * Creates Discord.js slash-command builders from canonical command routes.
 *
 * Routes sharing a root are combined into subcommands and subcommand groups.
 * Prefix-only routes whose effective `slash` setting is `false` are omitted.
 *
 * The returned builders are sorted by root-command name.
 *
 * @param routes - Canonical command routes to convert.
 *
 * @throws Error when the routes form a command structure that Discord cannot
 * represent, such as combining a directly executable root with subcommands.
 */
export declare function createSlashCommandBuilders(routes: readonly CommandRoute[]): SlashCommandBuilder[];
/**
 * Creates a Discord.js slash-command builder for one flat command.
 *
 * This compatibility helper does not create subcommands. Use
 * {@link createSlashCommandBuilders} when working with command routes.
 *
 * @param command - Flat command to convert.
 */
export declare function createSlashCommandBuilder(command: AnyCommand): SlashCommandBuilder;
/**
 * Creates JSON-ready slash-command payloads from canonical command routes.
 *
 * This is the registration counterpart to {@link createSlashCommandBuilders}.
 * The returned payloads can be passed directly to `SlashCommandRegistrar`.
 */
export declare function createSlashCommandPayloads(routes: readonly CommandRoute[]): SlashCommandPayload[];
//# sourceMappingURL=slash.d.ts.map