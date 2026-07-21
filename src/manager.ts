import { EventEmitter } from "node:events";
import {
    type ChatInputCommandInteraction,
    Collection,
    InteractionContextType,
    type Message,
    type PermissionResolvable,
    PermissionsBitField,
    SlashCommandBuilder,
} from "discord.js";
import {
    CommandContext,
    type CommandFeedbackRenderer,
    type CommandLogger,
    defaultCommandFeedbackRenderer,
    defaultCommandLogger,
} from "@/context";
import {
    type ArgumentSchema,
    addArgumentsToSlashCommand,
    formatArgumentUsage,
    type ParsedArguments,
    parseInteractionArguments,
    parseMessageArguments,
    tokenizeArguments,
    validateArgumentSchema,
} from "./arguments";

const EMPTY_ARGUMENTS = {} as const satisfies ArgumentSchema;

export interface Command<
    Schema extends ArgumentSchema = typeof EMPTY_ARGUMENTS,
> {
    name: string;
    description: string;

    aliases?: readonly string[];
    arguments?: Schema;

    slash?: boolean;
    guildOnly?: boolean;

    userPermissions?: readonly PermissionResolvable[];
    botPermissions?: readonly PermissionResolvable[];

    execute(ctx: CommandContext<ParsedArguments<Schema>>): Promise<void> | void;
}

export type AnyCommand = Command<ArgumentSchema>;

export function defineCommand<
    const Schema extends ArgumentSchema = typeof EMPTY_ARGUMENTS,
>(command: Command<Schema>): Command<Schema> {
    return command;
}

export interface CommandHandlerConfig {
    prefix: string | ((message: Message) => string | Promise<string>);

    allowOnlyDevs?: boolean;
    devIds?: readonly string[];

    logger?: CommandLogger;

    feedbackRenderer?: CommandFeedbackRenderer;

    isIgnored?: (userId: string) => boolean;
    allowBots?: boolean;
}

interface ResolvedCommandHandlerConfig {
    prefix: string | ((message: Message) => string | Promise<string>);

    allowOnlyDevs: boolean;
    devIds: readonly string[];

    logger: CommandLogger;

    feedbackRenderer: CommandFeedbackRenderer;

    isIgnored: ((userId: string) => boolean) | undefined;

    allowBots: boolean;
}

export function createSlashCommandBuilder(
    command: AnyCommand,
): SlashCommandBuilder {
    const builder = new SlashCommandBuilder()
        .setName(command.name)
        .setDescription(command.description);

    if (command.guildOnly) {
        builder.setContexts(InteractionContextType.Guild);
    }

    if (command.userPermissions?.length) {
        builder.setDefaultMemberPermissions(
            new PermissionsBitField(command.userPermissions).bitfield,
        );
    }

    addArgumentsToSlashCommand(builder, command.arguments ?? EMPTY_ARGUMENTS);

    return builder;
}

function validateCommand(command: AnyCommand): void {
    if (!/^[a-z0-9_-]{1,32}$/u.test(command.name)) {
        throw new Error(
            `Command name "${command.name}" must ` +
                "contain only lowercase letters, " +
                "numbers, hyphens, or underscores " +
                "and must be 1 to 32 characters long.",
        );
    }

    if (command.description.length < 1 || command.description.length > 100) {
        throw new Error(
            `Command "${command.name}" must have ` +
                "a description between 1 and 100 " +
                "characters.",
        );
    }

    for (const alias of command.aliases ?? []) {
        if (!/^[a-z0-9_-]+$/u.test(alias)) {
            throw new Error(
                `Command "${command.name}" has an ` +
                    `invalid alias: "${alias}".`,
            );
        }
    }

    validateArgumentSchema(command.name, command.arguments ?? EMPTY_ARGUMENTS);
}

export class CommandManager extends EventEmitter {
    public readonly commands = new Collection<string, AnyCommand>();

    private readonly config: ResolvedCommandHandlerConfig;

    private static _instance: CommandManager;

    constructor(config: CommandHandlerConfig) {
        super();

        this.config = {
            prefix: config.prefix,

            allowOnlyDevs: config.allowOnlyDevs ?? false,

            devIds: config.devIds ?? [],

            logger: config.logger ?? defaultCommandLogger,

            feedbackRenderer:
                config.feedbackRenderer ?? defaultCommandFeedbackRenderer,

            isIgnored: config.isIgnored,

            allowBots: config.allowBots ?? false,
        };

        CommandManager._instance = this;
    }

    public static get instance(): CommandManager {
        if (!CommandManager._instance) {
            throw new Error(
                "CommandManager has not been " + "initialized yet.",
            );
        }

        return CommandManager._instance;
    }

    public registerCommands(commands: readonly AnyCommand[]): void {
        for (const command of commands) {
            validateCommand(command);

            this.registerName(command.name, command);

            for (const alias of command.aliases ?? []) {
                this.registerName(alias, command);
            }
        }
    }

    private registerName(name: string, command: AnyCommand): void {
        const normalizedName = name.toLowerCase();

        const existing = this.commands.get(normalizedName);

        if (existing && existing !== command) {
            throw new Error(
                `Command name or alias ` +
                    `"${normalizedName}" is already ` +
                    `registered by "${existing.name}".`,
            );
        }

        this.commands.set(normalizedName, command);
    }

    private createContext<Arguments extends object>(
        payload: ChatInputCommandInteraction | Message,
        args: Arguments,
    ): CommandContext<Arguments> {
        return new CommandContext(payload, args, {
            logger: this.config.logger,

            feedbackRenderer: this.config.feedbackRenderer,
        });
    }

    public async handleMessage(message: Message): Promise<boolean> {
        const prefix =
            typeof this.config.prefix === "function"
                ? await this.config.prefix(message)
                : this.config.prefix;

        const normalizedContent = message.content
            .replace(/[\u200B-\u200D\uFEFF]/gu, "")
            .trimStart();

        if (!normalizedContent.startsWith(prefix)) {
            return false;
        }

        if (!this.canProcessUser(message.author.id, message.author.bot)) {
            return false;
        }

        const commandInput = normalizedContent.slice(prefix.length).trim();

        const tokenized = tokenizeArguments(commandInput);

        if (!tokenized.success) {
            const context = this.createContext(message, {});

            await context.replyError(tokenized.error.message);

            return false;
        }

        const tokens = tokenized.tokens;

        const commandName = tokens.shift()?.toLowerCase();

        if (!commandName) {
            return false;
        }

        const command = this.commands.get(commandName);

        if (!command) {
            return false;
        }

        const baseContext = this.createContext(message, {});

        if (!(await this.checkAccess(command, baseContext))) {
            return false;
        }

        const parsed = await parseMessageArguments(
            command.arguments ?? EMPTY_ARGUMENTS,
            message,
            tokens,
        );

        if (!parsed.success) {
            const usage = formatArgumentUsage(
                command.arguments ?? EMPTY_ARGUMENTS,
            );

            const usageText = usage
                ? `\nUsage: \`${prefix}` + `${command.name} ${usage}\``
                : "";

            await baseContext.replyError(parsed.error.message + usageText);

            return false;
        }

        return this.executeCommand(
            command,
            this.createContext(message, parsed.value),
        );
    }

    public async handleInteraction(
        interaction: ChatInputCommandInteraction,
    ): Promise<boolean> {
        if (!interaction.isChatInputCommand()) {
            return false;
        }

        if (!this.canProcessUser(interaction.user.id, interaction.user.bot)) {
            return false;
        }

        const command = this.commands.get(
            interaction.commandName.toLowerCase(),
        );

        if (!command || command.slash === false) {
            return false;
        }

        const baseContext = this.createContext(interaction, {});

        if (!(await this.checkAccess(command, baseContext))) {
            return false;
        }

        const parsed = await parseInteractionArguments(
            command.arguments ?? EMPTY_ARGUMENTS,
            interaction,
        );

        if (!parsed.success) {
            await baseContext.replyError(parsed.error.message);

            return false;
        }

        return this.executeCommand(
            command,
            this.createContext(interaction, parsed.value),
        );
    }

    private canProcessUser(userId: string, isBot: boolean): boolean {
        if (isBot && !this.config.allowBots) {
            return false;
        }

        if (this.config.isIgnored?.(userId)) {
            return false;
        }

        if (this.config.allowOnlyDevs && !this.config.devIds.includes(userId)) {
            return false;
        }

        return true;
    }

    private async checkAccess(
        command: AnyCommand,
        context: CommandContext<Record<string, never>>,
    ): Promise<boolean> {
        if (command.guildOnly && !context.guild) {
            await context.replyError(
                "This command can only be used " + "in a server.",
            );

            return false;
        }

        if (!context.guild) {
            return true;
        }

        const channel = context.raw.channel;

        if (!channel?.isTextBased() || channel.isDMBased()) {
            return true;
        }

        const member = context.member ?? (await context.fetchMember());

        if (!member) {
            await context.replyError(
                "Could not resolve your server " + "member data.",
            );

            return false;
        }

        if (command.userPermissions?.length) {
            const missingPermissions = member
                .permissionsIn(channel)
                .missing(command.userPermissions);

            if (missingPermissions.length > 0) {
                await context.replyError(
                    "You lack the required " +
                        "permissions to use this: " +
                        `\`${missingPermissions.join(", ")}\``,
                );

                return false;
            }
        }

        if (command.botPermissions?.length) {
            const botMember =
                context.guild.members.me ??
                (await context.guild.members.fetchMe().catch(() => null));

            if (!botMember) {
                await context.replyError(
                    "Could not resolve my server " + "member data.",
                );

                return false;
            }

            const missingPermissions = botMember
                .permissionsIn(channel)
                .missing(command.botPermissions);

            if (missingPermissions.length > 0) {
                await context.replyError(
                    "I am missing permissions " +
                        "to execute this: " +
                        `\`${missingPermissions.join(", ")}\``,
                );

                return false;
            }
        }

        return true;
    }

    private async executeCommand(
        command: AnyCommand,
        context: CommandContext<ParsedArguments<ArgumentSchema>>,
    ): Promise<boolean> {
        try {
            this.emit("commandStart", command, context);

            await command.execute(context);

            this.emit("commandSuccess", command, context);

            return true;
        } catch (error) {
            this.config.logger.error(`Error executing ${command.name}:`, error);

            await context
                .replyError(
                    "An unexpected error occurred " +
                        "while executing this command.",
                )
                .catch(() => {});

            this.emit("commandError", command, error, context);

            return false;
        }
    }
}
