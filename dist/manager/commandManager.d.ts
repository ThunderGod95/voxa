import { EventEmitter } from "node:events";
import type { ChatInputCommandInteraction, Collection, Message } from "discord.js";
import { type ArgumentSchema, type ParsedArguments } from "../arguments";
import { CommandContext } from "../context";
import { type AnyCommand, type CommandHandlerConfig } from "./command";
import { type CommandRoute } from "./route";
/**
 * Lifecycle events emitted by {@link CommandManager}.
 *
 * This interface documents the argument order for each event. The manager
 * continues to extend Node.js `EventEmitter`, so listeners are attached with
 * `manager.on(eventName, listener)`.
 */
export interface CommandManagerEventMap {
    /**
     * Emitted immediately before command execution.
     */
    commandStart: [
        command: AnyCommand,
        context: CommandContext<ParsedArguments<ArgumentSchema>>,
        route: CommandRoute
    ];
    /**
     * Emitted after a command completes without throwing.
     */
    commandSuccess: [
        command: AnyCommand,
        context: CommandContext<ParsedArguments<ArgumentSchema>>,
        route: CommandRoute
    ];
    /**
     * Emitted after a command throws an error.
     */
    commandError: [
        command: AnyCommand,
        error: unknown,
        context: CommandContext<ParsedArguments<ArgumentSchema>>,
        route: CommandRoute
    ];
}
/**
 * Registers and dispatches unified prefix and slash commands.
 *
 * The manager emits:
 *
 * - `commandStart(command, context, route)` before execution.
 * - `commandSuccess(command, context, route)` after successful execution.
 * - `commandError(command, error, context, route)` after an exception.
 */
export declare class CommandManager extends EventEmitter {
    /**
     * Canonical routes keyed by normalized paths.
     *
     * Example keys include `ping`, `admin ban`, and `admin user info`.
     */
    readonly routes: Collection<string, CommandRoute>;
    /**
     * Prefix-command lookup containing canonical paths and every alias
     * combination.
     *
     * The value is the command definition rather than its route. Use
     * {@link routes} when route or group metadata is required.
     */
    readonly commands: Collection<string, AnyCommand>;
    private readonly registry;
    private readonly config;
    private readonly accessController;
    private static _instance;
    /**
     * Creates a command manager.
     *
     * The most recently constructed manager is also exposed through
     * {@link CommandManager.instance}.
     *
     * @param config - Prefix, access, logging, and feedback configuration.
     */
    constructor(config: CommandHandlerConfig);
    /**
     * Returns the most recently constructed command manager.
     *
     * @throws Error when no manager has been constructed yet.
     */
    static get instance(): CommandManager;
    /**
     * Registers flat commands.
     *
     * This compatibility API maps each command to a single-segment route. Use
     * {@link registerCommandRoutes} for subcommands and command groups.
     *
     * Registration is atomic. No command is added when any command in the
     * supplied batch is invalid or conflicts with an existing path or alias.
     *
     * @param commands - Flat commands to register.
     *
     * @throws Error when a command is invalid or conflicts with an existing
     * command or alias.
     */
    registerCommands(commands: readonly AnyCommand[]): void;
    /**
     * Registers canonical command routes and their prefix aliases.
     *
     * The entire batch is validated before the manager is mutated.
     *
     * @param routes - Routes to register.
     *
     * @throws Error when a route is invalid or when a canonical path or alias
     * conflicts with an existing route.
     */
    registerCommandRoutes(routes: readonly CommandRoute[]): void;
    /**
     * Handles a Discord message as a possible prefix command.
     *
     * Pass messages from `messageCreate` or `messageUpdate` to this method.
     *
     * The returned value is `true` only when a resolved command completes
     * successfully. Unrelated messages, rejected users, parsing failures,
     * access failures, and command exceptions return `false`.
     *
     * @param message - Discord message to inspect.
     */
    handleMessage(message: Message): Promise<boolean>;
    /**
     * Handles a Discord chat-input interaction as a possible slash command.
     *
     * Pass chat-input interactions from `interactionCreate` to this method.
     *
     * The returned value is `true` only when a registered slash route completes
     * successfully.
     *
     * @param interaction - Chat-input interaction to process.
     */
    handleInteraction(interaction: ChatInputCommandInteraction): Promise<boolean>;
    private resolvePrefix;
    private createContext;
    private executeCommand;
}
//# sourceMappingURL=commandManager.d.ts.map