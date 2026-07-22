import { EventEmitter } from "node:events";
import {
	type ChatInputCommandInteraction,
	Collection,
	InteractionContextType,
	type Message,
	type PermissionResolvable,
	PermissionsBitField,
	SlashCommandBuilder,
	type SlashCommandSubcommandBuilder,
} from "discord.js";
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
import {
	CommandContext,
	type CommandFeedbackRenderer,
	type CommandLogger,
	defaultCommandFeedbackRenderer,
	defaultCommandLogger,
} from "./context";

const EMPTY_ARGUMENTS = {} as const satisfies ArgumentSchema;
const COMMAND_NAME_PATTERN = /^[a-z0-9_-]{1,32}$/u;

export interface CommandDefinition<
	Schema extends ArgumentSchema = typeof EMPTY_ARGUMENTS,
> {
	/**
	 * Directory-loaded commands may omit the name. In that case, the loader
	 * derives it from the filename.
	 */
	name?: string;

	description: string;
	aliases?: readonly string[];
	arguments?: Schema;

	slash?: boolean;
	guildOnly?: boolean;

	userPermissions?: readonly PermissionResolvable[];
	botPermissions?: readonly PermissionResolvable[];

	execute(ctx: CommandContext<ParsedArguments<Schema>>): Promise<void> | void;
}

export type Command<Schema extends ArgumentSchema = typeof EMPTY_ARGUMENTS> =
	CommandDefinition<Schema> & {
		name: string;
	};

export type AnyCommand = Command<ArgumentSchema>;
export type AnyCommandDefinition = CommandDefinition<ArgumentSchema>;

export function defineCommand<
	const Schema extends ArgumentSchema = typeof EMPTY_ARGUMENTS,
>(command: Command<Schema>): Command<Schema>;

export function defineCommand<
	const Schema extends ArgumentSchema = typeof EMPTY_ARGUMENTS,
>(command: CommandDefinition<Schema>): CommandDefinition<Schema>;

export function defineCommand<
	const Schema extends ArgumentSchema = typeof EMPTY_ARGUMENTS,
>(command: CommandDefinition<Schema>): CommandDefinition<Schema> {
	return command;
}

export interface CommandGroup {
	description: string;
	aliases?: readonly string[];

	/**
	 * Disables slash registration for all routes below this directory.
	 * Prefix commands remain available.
	 */
	slash?: boolean;

	guildOnly?: boolean;

	userPermissions?: readonly PermissionResolvable[];
	botPermissions?: readonly PermissionResolvable[];
}

export function defineCommandGroup(group: CommandGroup): CommandGroup {
	return group;
}

export type CommandPath =
	| readonly [string]
	| readonly [string, string]
	| readonly [string, string, string];

export interface CommandRoute {
	/**
	 * [command]
	 *
	 * [command, subcommand]
	 *
	 * [command, subcommandGroup, subcommand]
	 */
	path: CommandPath;

	command: AnyCommand;

	/**
	 * One metadata entry for every route segment except the command leaf.
	 */
	groups?: readonly CommandGroup[];
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

type ResolvedCommandHandlerConfig = Required<
	Omit<CommandHandlerConfig, "isIgnored">
> & {
	isIgnored?: CommandHandlerConfig["isIgnored"];
};

interface EffectiveCommandAccess {
	guildOnly: boolean;
	userPermissions: readonly PermissionResolvable[];
	botPermissions: readonly PermissionResolvable[];
}

type DirectSubcommandRoute = CommandRoute & {
	path: readonly [string, string];
	groups: readonly [CommandGroup];
};

type GroupedSubcommandRoute = CommandRoute & {
	path: readonly [string, string, string];
	groups: readonly [CommandGroup, CommandGroup];
};

function isDirectSubcommandRoute(
	route: CommandRoute,
): route is DirectSubcommandRoute {
	return route.path.length === 2 && route.groups?.length === 1;
}

function isGroupedSubcommandRoute(
	route: CommandRoute,
): route is GroupedSubcommandRoute {
	return route.path.length === 3 && route.groups?.length === 2;
}

function routeKey(path: readonly string[]): string {
	return path.map((segment) => segment.toLowerCase()).join(" ");
}

function validateName(name: string, label: string): void {
	if (!COMMAND_NAME_PATTERN.test(name)) {
		throw new Error(
			`${label} "${name}" must contain only lowercase letters, ` +
				"numbers, hyphens, or underscores and must be " +
				"1 to 32 characters long.",
		);
	}
}

function validateDescription(description: string, label: string): void {
	if (description.length < 1 || description.length > 100) {
		throw new Error(
			`${label} must have a description between ` + "1 and 100 characters.",
		);
	}
}

function validateAliases(aliases: readonly string[], label: string): void {
	for (const alias of aliases) {
		validateName(alias, `${label} alias`);
	}
}

function validateCommand(command: AnyCommand): void {
	validateName(command.name, "Command name");

	validateDescription(command.description, `Command "${command.name}"`);

	validateAliases(command.aliases ?? [], `Command "${command.name}"`);

	validateArgumentSchema(command.name, command.arguments ?? EMPTY_ARGUMENTS);
}

export function validateCommandRoute(route: CommandRoute): void {
	const { path, command } = route;
	const groups = route.groups ?? [];

	for (const segment of path) {
		validateName(segment, "Command route segment");
	}

	if (path.at(-1) !== command.name) {
		throw new Error(
			`Command route "${path.join(" ")}" must end with ` +
				`the command name "${command.name}".`,
		);
	}

	if (groups.length !== path.length - 1) {
		throw new Error(
			`Command route "${path.join(" ")}" requires exactly ` +
				`${path.length - 1} group metadata entries.`,
		);
	}

	validateCommand(command);

	groups.forEach((group, index) => {
		const groupPath = path.slice(0, index + 1).join(" ");

		validateDescription(group.description, `Command group "${groupPath}"`);

		validateAliases(group.aliases ?? [], `Command group "${groupPath}"`);
	});
}

function getEffectiveAccess(route: CommandRoute): EffectiveCommandAccess {
	const groups = route.groups ?? [];

	return {
		guildOnly:
			route.command.guildOnly === true ||
			groups.some((group) => group.guildOnly === true),

		userPermissions: [
			...groups.flatMap((group) => group.userPermissions ?? []),
			...(route.command.userPermissions ?? []),
		],

		botPermissions: [
			...groups.flatMap((group) => group.botPermissions ?? []),
			...(route.command.botPermissions ?? []),
		],
	};
}

function isSlashEnabled(route: CommandRoute): boolean {
	return (
		route.command.slash !== false &&
		(route.groups ?? []).every((group) => group.slash !== false)
	);
}

function applyRootCommandSettings(
	builder: SlashCommandBuilder,
	guildOnly: boolean,
	userPermissions: readonly PermissionResolvable[],
): void {
	if (guildOnly) {
		builder.setContexts(InteractionContextType.Guild);
	}

	if (userPermissions.length > 0) {
		builder.setDefaultMemberPermissions(
			new PermissionsBitField(userPermissions).bitfield,
		);
	}
}

function addRouteArguments(
	builder: SlashCommandBuilder | SlashCommandSubcommandBuilder,
	route: CommandRoute,
): void {
	addArgumentsToSlashCommand(
		builder,
		route.command.arguments ?? EMPTY_ARGUMENTS,
	);
}

function createFlatSlashCommandBuilder(
	route: CommandRoute,
): SlashCommandBuilder {
	const builder = new SlashCommandBuilder()
		.setName(route.command.name)
		.setDescription(route.command.description);

	const access = getEffectiveAccess(route);

	applyRootCommandSettings(builder, access.guildOnly, access.userPermissions);

	addRouteArguments(builder, route);

	return builder;
}

function permissionSignature(
	permissions: readonly PermissionResolvable[],
): string {
	return permissions.map(String).join("\u0000");
}

function assertConsistentGroupMetadata(
	routes: readonly CommandRoute[],
	groupIndex: number,
): CommandGroup {
	const first = routes[0]?.groups?.[groupIndex];

	if (!first) {
		throw new Error("Missing command group metadata.");
	}

	for (const route of routes.slice(1)) {
		const candidate = route.groups?.[groupIndex];

		if (!candidate) {
			throw new Error(
				`Missing group metadata for route ` + `"${route.path.join(" ")}".`,
			);
		}

		if (
			candidate.description !== first.description ||
			candidate.guildOnly !== first.guildOnly ||
			candidate.slash !== first.slash ||
			permissionSignature(candidate.userPermissions ?? []) !==
				permissionSignature(first.userPermissions ?? [])
		) {
			throw new Error(
				`Inconsistent metadata for command group ` +
					`"${route.path.slice(0, groupIndex + 1).join(" ")}".`,
			);
		}
	}

	return first;
}

function createNestedSlashCommandBuilder(
	rootName: string,
	routes: readonly CommandRoute[],
): SlashCommandBuilder {
	const rootGroup = assertConsistentGroupMetadata(routes, 0);

	const builder = new SlashCommandBuilder()
		.setName(rootName)
		.setDescription(rootGroup.description);

	const allGuildOnly = routes.every(
		(route) => getEffectiveAccess(route).guildOnly,
	);

	applyRootCommandSettings(
		builder,
		rootGroup.guildOnly === true || allGuildOnly,
		rootGroup.userPermissions ?? [],
	);

	const directSubcommands = routes
		.filter(isDirectSubcommandRoute)
		.sort((left, right) =>
			routeKey(left.path).localeCompare(routeKey(right.path)),
		);

	const groupedRoutes = routes.filter(isGroupedSubcommandRoute);

	const groupNames = new Set(groupedRoutes.map((route) => route.path[1]));

	for (const route of directSubcommands) {
		const subcommandName = route.path[1];

		if (groupNames.has(subcommandName)) {
			throw new Error(
				`"${rootName} ${subcommandName}" cannot be both ` +
					"a subcommand and a subcommand group.",
			);
		}
	}

	if (directSubcommands.length + groupNames.size > 25) {
		throw new Error(
			`Slash command "${rootName}" cannot contain more ` +
				"than 25 subcommands and subcommand groups.",
		);
	}

	for (const route of directSubcommands) {
		builder.addSubcommand((subcommand) => {
			subcommand
				.setName(route.path[1])
				.setDescription(route.command.description);

			addRouteArguments(subcommand, route);

			return subcommand;
		});
	}

	const groupedByName = new Map<string, GroupedSubcommandRoute[]>();

	for (const route of groupedRoutes) {
		const groupName = route.path[1];
		const existing = groupedByName.get(groupName) ?? [];

		existing.push(route);
		groupedByName.set(groupName, existing);
	}

	const sortedGroups = [...groupedByName.entries()].sort(([left], [right]) =>
		left.localeCompare(right),
	);

	for (const [groupName, groupRoutes] of sortedGroups) {
		if (groupRoutes.length > 25) {
			throw new Error(
				`Slash subcommand group ` +
					`"${rootName} ${groupName}" cannot contain ` +
					"more than 25 subcommands.",
			);
		}

		const group = assertConsistentGroupMetadata(groupRoutes, 1);

		builder.addSubcommandGroup((subcommandGroup) => {
			subcommandGroup.setName(groupName).setDescription(group.description);

			const sortedRoutes = groupRoutes.sort((left, right) =>
				routeKey(left.path).localeCompare(routeKey(right.path)),
			);

			for (const route of sortedRoutes) {
				subcommandGroup.addSubcommand((subcommand) => {
					subcommand
						.setName(route.path[2])
						.setDescription(route.command.description);

					addRouteArguments(subcommand, route);

					return subcommand;
				});
			}

			return subcommandGroup;
		});
	}

	return builder;
}

export function createSlashCommandBuilders(
	routes: readonly CommandRoute[],
): SlashCommandBuilder[] {
	for (const route of routes) {
		validateCommandRoute(route);
	}

	const slashRoutes = routes.filter(isSlashEnabled);
	const routesByRoot = new Map<string, CommandRoute[]>();

	for (const route of slashRoutes) {
		const root = route.path[0];
		const existing = routesByRoot.get(root) ?? [];

		existing.push(route);
		routesByRoot.set(root, existing);
	}

	const builders: SlashCommandBuilder[] = [];

	const sortedRoots = [...routesByRoot.entries()].sort(([left], [right]) =>
		left.localeCompare(right),
	);

	for (const [root, rootRoutes] of sortedRoots) {
		const flatRoutes = rootRoutes.filter((route) => route.path.length === 1);

		const nestedRoutes = rootRoutes.filter((route) => route.path.length > 1);

		if (flatRoutes.length > 0 && nestedRoutes.length > 0) {
			throw new Error(
				`Slash command "${root}" cannot execute ` +
					"directly and also contain subcommands.",
			);
		}

		if (flatRoutes.length > 1) {
			throw new Error(`Duplicate slash command route "${root}".`);
		}

		const flatRoute = flatRoutes[0];

		builders.push(
			flatRoute
				? createFlatSlashCommandBuilder(flatRoute)
				: createNestedSlashCommandBuilder(root, nestedRoutes),
		);
	}

	return builders;
}

/**
 * Backwards-compatible builder for a single flat command.
 */
export function createSlashCommandBuilder(
	command: AnyCommand,
): SlashCommandBuilder {
	return createFlatSlashCommandBuilder({
		path: [command.name],
		command,
		groups: [],
	});
}

function getSegmentAliases(
	route: CommandRoute,
	index: number,
): readonly string[] {
	if (index === route.path.length - 1) {
		return route.command.aliases ?? [];
	}

	return route.groups?.[index]?.aliases ?? [];
}

function createRouteLookupKeys(route: CommandRoute): string[] {
	const variants = route.path.map((segment, index) => [
		segment,
		...getSegmentAliases(route, index),
	]);

	let keys: string[][] = [[]];

	for (const segmentVariants of variants) {
		keys = keys.flatMap((prefix) =>
			segmentVariants.map((segment) => [...prefix, segment]),
		);
	}

	return [...new Set(keys.map(routeKey))];
}

export class CommandManager extends EventEmitter {
	/**
	 * Canonical routes:
	 * "ping"
	 * "admin ban"
	 * "admin user info"
	 */
	public readonly routes = new Collection<string, CommandRoute>();

	/**
	 * Canonical routes and every prefix alias combination.
	 */
	public readonly commands = new Collection<string, AnyCommand>();

	private readonly routeLookup = new Collection<string, CommandRoute>();

	private readonly config: ResolvedCommandHandlerConfig;

	private static _instance: CommandManager;

	public constructor(config: CommandHandlerConfig) {
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
			throw new Error("CommandManager has not been initialized yet.");
		}

		return CommandManager._instance;
	}

	/**
	 * Backwards-compatible registration for flat commands.
	 */
	public registerCommands(commands: readonly AnyCommand[]): void {
		this.registerCommandRoutes(
			commands.map((command) => ({
				path: [command.name],
				command,
				groups: [],
			})),
		);
	}

	public registerCommandRoutes(routes: readonly CommandRoute[]): void {
		const stagedCanonical = new Map<string, CommandRoute>();

		const stagedLookup = new Map<string, CommandRoute>();

		/*
		 * Validate and stage everything before mutating the manager.
		 * Registration is therefore atomic.
		 */
		for (const route of routes) {
			validateCommandRoute(route);

			const canonicalKey = routeKey(route.path);

			if (this.routes.has(canonicalKey) || stagedCanonical.has(canonicalKey)) {
				throw new Error(
					`Command route "${canonicalKey}" ` + "is already registered.",
				);
			}

			stagedCanonical.set(canonicalKey, route);

			for (const lookupKey of createRouteLookupKeys(route)) {
				const existing =
					stagedLookup.get(lookupKey) ?? this.routeLookup.get(lookupKey);

				if (existing && routeKey(existing.path) !== canonicalKey) {
					throw new Error(
						`Command route or alias ` +
							`"${lookupKey}" is already ` +
							`registered by ` +
							`"${existing.path.join(" ")}".`,
					);
				}

				stagedLookup.set(lookupKey, route);
			}
		}

		for (const [canonicalKey, route] of stagedCanonical) {
			this.routes.set(canonicalKey, route);
		}

		for (const [lookupKey, route] of stagedLookup) {
			this.routeLookup.set(lookupKey, route);

			this.commands.set(lookupKey, route.command);
		}
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

	private resolveMessageRoute(tokens: readonly string[]): {
		route: CommandRoute;
		consumedTokens: number;
	} | null {
		const maximumRouteLength = Math.min(3, tokens.length);

		/*
		 * Longest-path matching prevents an argument from being confused with
		 * a subcommand:
		 *
		 * admin user info -> checked before admin user -> before admin.
		 */
		for (let length = maximumRouteLength; length >= 1; length--) {
			const key = routeKey(tokens.slice(0, length));

			const route = this.routeLookup.get(key);

			if (route) {
				return {
					route,
					consumedTokens: length,
				};
			}
		}

		return null;
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
			await this.createContext(message, {}).replyError(tokenized.error.message);

			return false;
		}

		const resolved = this.resolveMessageRoute(tokenized.tokens);

		if (!resolved) {
			return false;
		}

		const { route, consumedTokens } = resolved;

		const argumentTokens = tokenized.tokens.slice(consumedTokens);

		const baseContext = this.createContext(message, {});

		if (!(await this.checkAccess(route, baseContext))) {
			return false;
		}

		const schema = route.command.arguments ?? EMPTY_ARGUMENTS;

		const parsed = await parseMessageArguments(schema, message, argumentTokens);

		if (!parsed.success) {
			const usage = formatArgumentUsage(schema);

			const routeUsage = route.path.join(" ");

			const usageText = usage
				? `\nUsage: \`${prefix}${routeUsage} ${usage}\``
				: "";

			await baseContext.replyError(parsed.error.message + usageText);

			return false;
		}

		return this.executeCommand(
			route,
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

		const subcommandGroup = interaction.options.getSubcommandGroup(false);

		const subcommand = interaction.options.getSubcommand(false);

		const path = [
			interaction.commandName,
			...(subcommandGroup ? [subcommandGroup] : []),
			...(subcommand ? [subcommand] : []),
		];

		const route = this.routes.get(routeKey(path));

		if (!route || !isSlashEnabled(route)) {
			return false;
		}

		const baseContext = this.createContext(interaction, {});

		if (!(await this.checkAccess(route, baseContext))) {
			return false;
		}

		const parsed = await parseInteractionArguments(
			route.command.arguments ?? EMPTY_ARGUMENTS,
			interaction,
		);

		if (!parsed.success) {
			await baseContext.replyError(parsed.error.message);

			return false;
		}

		return this.executeCommand(
			route,
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
		route: CommandRoute,
		context: CommandContext<Record<string, never>>,
	): Promise<boolean> {
		const access = getEffectiveAccess(route);

		if (access.guildOnly && !context.guild) {
			await context.replyError("This command can only be used in a server.");

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
			await context.replyError("Could not resolve your server member data.");

			return false;
		}

		if (access.userPermissions.length > 0) {
			const missingPermissions = member
				.permissionsIn(channel)
				.missing(access.userPermissions);

			if (missingPermissions.length > 0) {
				await context.replyError(
					"You lack the required " +
						"permissions to use this: " +
						`\`${missingPermissions.join(", ")}\``,
				);

				return false;
			}
		}

		if (access.botPermissions.length > 0) {
			const botMember =
				context.guild.members.me ??
				(await context.guild.members.fetchMe().catch(() => null));

			if (!botMember) {
				await context.replyError("Could not resolve my server member data.");

				return false;
			}

			const missingPermissions = botMember
				.permissionsIn(channel)
				.missing(access.botPermissions);

			if (missingPermissions.length > 0) {
				await context.replyError(
					`I am missing permissions to execute this: \`${missingPermissions.join(", ")}\``,
				);

				return false;
			}
		}

		return true;
	}

	private async executeCommand(
		route: CommandRoute,
		context: CommandContext<ParsedArguments<ArgumentSchema>>,
	): Promise<boolean> {
		const commandName = route.path.join(" ");

		try {
			this.emit("commandStart", route.command, context, route);

			await route.command.execute(context);

			this.emit("commandSuccess", route.command, context, route);

			return true;
		} catch (error) {
			this.config.logger.error(`Error executing ${commandName}:`, error);

			await context
				.replyError(
					"An unexpected error occurred " + "while executing this command.",
				)
				.catch(() => {});

			this.emit("commandError", route.command, error, context, route);

			return false;
		}
	}
}
