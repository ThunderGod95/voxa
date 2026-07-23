import { EventEmitter } from "node:events";
import { formatArgumentUsage, parseInteractionArguments, parseMessageArguments, tokenizeArguments, } from "../arguments";
import { CommandContext, defaultCommandFeedbackRenderer, defaultCommandLogger, } from "../context";
import { CommandAccessController, isSlashRouteEnabled } from "./access";
import { EMPTY_ARGUMENTS, } from "./command";
import { CommandRouteRegistry } from "./route";
function resolveCommandHandlerConfig(config) {
    return {
        prefix: config.prefix,
        allowOnlyDevs: config.allowOnlyDevs ?? false,
        devIds: config.devIds ?? [],
        logger: config.logger ?? defaultCommandLogger,
        feedbackRenderer: config.feedbackRenderer ?? defaultCommandFeedbackRenderer,
        isIgnored: config.isIgnored,
        allowBots: config.allowBots ?? false,
    };
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
export class CommandManager extends EventEmitter {
    /**
     * Canonical routes keyed by normalized paths.
     *
     * Example keys include `ping`, `admin ban`, and `admin user info`.
     */
    routes;
    /**
     * Prefix-command lookup containing canonical paths and every alias
     * combination.
     *
     * The value is the command definition rather than its route. Use
     * {@link routes} when route or group metadata is required.
     */
    commands;
    registry;
    config;
    accessController;
    static _instance;
    /**
     * Creates a command manager.
     *
     * The most recently constructed manager is also exposed through
     * {@link CommandManager.instance}.
     *
     * @param config - Prefix, access, logging, and feedback configuration.
     */
    constructor(config) {
        super();
        this.config = resolveCommandHandlerConfig(config);
        this.registry = new CommandRouteRegistry();
        this.routes = this.registry.routes;
        this.commands = this.registry.commands;
        this.accessController = new CommandAccessController(this.config);
        CommandManager._instance = this;
    }
    /**
     * Returns the most recently constructed command manager.
     *
     * @throws Error when no manager has been constructed yet.
     */
    static get instance() {
        if (!CommandManager._instance) {
            throw new Error("CommandManager has not been initialized yet.");
        }
        return CommandManager._instance;
    }
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
    registerCommands(commands) {
        this.registerCommandRoutes(commands.map((command) => ({
            path: [command.name],
            command,
            groups: [],
        })));
    }
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
    registerCommandRoutes(routes) {
        this.registry.register(routes);
    }
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
    async handleMessage(message) {
        const prefix = await this.resolvePrefix(message);
        const normalizedContent = message.content
            .replace(/[\u200B-\u200D\uFEFF]/gu, "")
            .trimStart();
        if (!normalizedContent.startsWith(prefix)) {
            return false;
        }
        if (!this.accessController.canProcessUser(message.author.id, message.author.bot)) {
            return false;
        }
        const commandInput = normalizedContent.slice(prefix.length).trim();
        const tokenized = tokenizeArguments(commandInput);
        if (!tokenized.success) {
            await this.createContext(message, {}).replyError(tokenized.error.message);
            return false;
        }
        const resolved = this.registry.resolveMessage(tokenized.tokens);
        if (!resolved) {
            return false;
        }
        const { route, consumedTokens } = resolved;
        const baseContext = this.createContext(message, {});
        if (!(await this.accessController.checkRoute(route, baseContext))) {
            return false;
        }
        const schema = route.command.arguments ?? EMPTY_ARGUMENTS;
        const parsed = await parseMessageArguments(schema, message, tokenized.tokens.slice(consumedTokens));
        if (!parsed.success) {
            const usage = formatArgumentUsage(schema);
            const usageText = usage
                ? `\nUsage: \`${prefix}${route.path.join(" ")} ${usage}\``
                : "";
            await baseContext.replyError(parsed.error.message + usageText);
            return false;
        }
        return this.executeCommand(route, this.createContext(message, parsed.value));
    }
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
    async handleInteraction(interaction) {
        if (!interaction.isChatInputCommand()) {
            return false;
        }
        if (!this.accessController.canProcessUser(interaction.user.id, interaction.user.bot)) {
            return false;
        }
        const subcommandGroup = interaction.options.getSubcommandGroup(false);
        const subcommand = interaction.options.getSubcommand(false);
        const path = [
            interaction.commandName,
            ...(subcommandGroup ? [subcommandGroup] : []),
            ...(subcommand ? [subcommand] : []),
        ];
        const route = this.registry.getCanonical(path);
        if (!route || !isSlashRouteEnabled(route)) {
            return false;
        }
        const baseContext = this.createContext(interaction, {});
        if (!(await this.accessController.checkRoute(route, baseContext))) {
            return false;
        }
        const parsed = await parseInteractionArguments(route.command.arguments ?? EMPTY_ARGUMENTS, interaction);
        if (!parsed.success) {
            await baseContext.replyError(parsed.error.message);
            return false;
        }
        return this.executeCommand(route, this.createContext(interaction, parsed.value));
    }
    resolvePrefix(message) {
        const prefix = this.config.prefix;
        return Promise.resolve(typeof prefix === "function" ? prefix(message) : prefix);
    }
    createContext(payload, args) {
        return new CommandContext(payload, args, {
            logger: this.config.logger,
            feedbackRenderer: this.config.feedbackRenderer,
        });
    }
    async executeCommand(route, context) {
        const commandName = route.path.join(" ");
        try {
            this.emit("commandStart", route.command, context, route);
            await route.command.execute(context);
            this.emit("commandSuccess", route.command, context, route);
            return true;
        }
        catch (error) {
            this.config.logger.error(`Error executing ${commandName}:`, error);
            await context
                .replyError("An unexpected error occurred while executing this command.")
                .catch(() => { });
            this.emit("commandError", route.command, error, context, route);
            return false;
        }
    }
}
//# sourceMappingURL=commandManager.js.map