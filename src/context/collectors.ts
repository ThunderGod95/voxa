import type {
	AwaitMessageCollectorOptionsParams,
	AwaitModalSubmitOptions,
	ChatInputCommandInteraction,
	InteractionCollector,
	MappedInteractionTypes,
	Message,
	MessageCollector,
	MessageCollectorOptions,
	MessageCollectorOptionsParams,
	MessageComponentType,
	ModalSubmitInteraction,
} from "discord.js";
import type { CommandChannel } from "./source";

interface CommandOwnedCollectorOptions {
	/**
	 * Restricts collected input to the user who invoked the command.
	 *
	 * @defaultValue true
	 */
	sameUser?: boolean;
}

type CommandComponentCustomIdOptions =
	| {
			/** Restricts collection to a single component custom ID. */
			customId?: string;
			customIds?: never;
	  }
	| {
			customId?: never;

			/** Restricts collection to any of the supplied component custom IDs. */
			customIds?: readonly string[];
	  };

/**
 * Interaction type produced by a Discord message component.
 */
export type CommandComponentInteraction<
	ComponentType extends MessageComponentType,
	InGuild extends boolean = boolean,
> = MappedInteractionTypes<InGuild>[ComponentType];

/**
 * Native Discord.js component collector filter.
 */
export type CommandComponentFilter<
	ComponentType extends MessageComponentType,
	InGuild extends boolean = boolean,
> = NonNullable<
	MessageCollectorOptionsParams<ComponentType, InGuild>["filter"]
>;

/**
 * Options for awaiting one message component interaction.
 */
export type CommandAwaitComponentOptions<
	ComponentType extends MessageComponentType,
	InGuild extends boolean = boolean,
> = Omit<
	AwaitMessageCollectorOptionsParams<ComponentType, InGuild>,
	"componentType" | "filter"
> &
	CommandOwnedCollectorOptions &
	CommandComponentCustomIdOptions & {
		/**
		 * Discord component type to collect.
		 *
		 * Supplying this preserves Discord.js's exact interaction inference.
		 */
		componentType: ComponentType;

		/**
		 * Additional filter applied after Voxa's ownership and custom-ID checks.
		 */
		filter?: CommandComponentFilter<ComponentType, InGuild>;
	};

/**
 * Options for creating a message component collector.
 */
export type CommandComponentCollectorOptions<
	ComponentType extends MessageComponentType,
	InGuild extends boolean = boolean,
> = Omit<
	MessageCollectorOptionsParams<ComponentType, InGuild>,
	"componentType" | "filter"
> &
	CommandOwnedCollectorOptions &
	CommandComponentCustomIdOptions & {
		/**
		 * Discord component type to collect.
		 *
		 * Supplying this preserves Discord.js's exact interaction inference.
		 */
		componentType: ComponentType;

		/**
		 * Additional filter applied after Voxa's ownership and custom-ID checks.
		 */
		filter?: CommandComponentFilter<ComponentType, InGuild>;
	};

/**
 * Discord.js collector returned for a component type.
 */
export type CommandComponentCollector<
	ComponentType extends MessageComponentType,
	InGuild extends boolean = boolean,
> = InteractionCollector<CommandComponentInteraction<ComponentType, InGuild>>;

/**
 * Native Discord.js message collector filter.
 */
export type CommandMessageFilter = NonNullable<
	MessageCollectorOptions["filter"]
>;

/**
 * Options for awaiting one message in the command channel.
 */
export type CommandAwaitMessageOptions = Omit<
	MessageCollectorOptions,
	"filter" | "max"
> &
	CommandOwnedCollectorOptions & {
		/**
		 * Additional filter applied after Voxa's ownership check.
		 */
		filter?: CommandMessageFilter;
	};

/**
 * Options for creating a message collector in the command channel.
 */
export type CommandMessageCollectorOptions = Omit<
	MessageCollectorOptions,
	"filter"
> &
	CommandOwnedCollectorOptions & {
		/**
		 * Additional filter applied after Voxa's ownership check.
		 */
		filter?: CommandMessageFilter;
	};

/**
 * Native Discord.js modal submission filter.
 */
export type CommandModalFilter = NonNullable<
	AwaitModalSubmitOptions<ModalSubmitInteraction>["filter"]
>;

/**
 * Options for awaiting a modal submission.
 */
export type CommandAwaitModalOptions = Omit<
	AwaitModalSubmitOptions<ModalSubmitInteraction>,
	"filter"
> &
	CommandOwnedCollectorOptions & {
		/** Restricts collection to a modal custom ID. */
		customId?: string;

		/**
		 * Additional filter applied after Voxa's ownership and custom-ID checks.
		 */
		filter?: CommandModalFilter;
	};

type MessageCollectorChannel = Extract<
	NonNullable<CommandChannel>,
	{
		createMessageCollector(options?: MessageCollectorOptions): MessageCollector;
	}
>;

function getMessageCollectorChannel(
	channel: CommandChannel,
): MessageCollectorChannel {
	if (!channel || !("createMessageCollector" in channel)) {
		throw new Error(
			"This command channel does not support message collectors.",
		);
	}

	return channel as MessageCollectorChannel;
}

function createComponentFilter<
	ComponentType extends MessageComponentType,
	InGuild extends boolean,
>(
	userId: string,
	sameUser: boolean,
	customId: string | undefined,
	customIds: readonly string[] | undefined,
	filter: CommandComponentFilter<ComponentType, InGuild> | undefined,
): CommandComponentFilter<ComponentType, InGuild> {
	const allowedCustomIds = customIds === undefined ? null : new Set(customIds);

	return async (...args) => {
		const [interaction] = args;

		if (sameUser && interaction.user.id !== userId) {
			return false;
		}

		if (customId !== undefined && interaction.customId !== customId) {
			return false;
		}

		if (
			allowedCustomIds !== null &&
			!allowedCustomIds.has(interaction.customId)
		) {
			return false;
		}

		if (filter && !(await filter(...args))) {
			return false;
		}

		return true;
	};
}

function createMessageFilter(
	userId: string,
	sameUser: boolean,
	filter: CommandMessageFilter | undefined,
): CommandMessageFilter {
	return async (...args) => {
		const [message] = args;

		if (sameUser && message.author.id !== userId) {
			return false;
		}

		if (filter && !(await filter(...args))) {
			return false;
		}

		return true;
	};
}

function createModalFilter(
	userId: string,
	sameUser: boolean,
	customId: string | undefined,
	filter: CommandModalFilter | undefined,
): CommandModalFilter {
	return async (...args) => {
		const [interaction] = args;

		if (sameUser && interaction.user.id !== userId) {
			return false;
		}

		if (customId !== undefined && interaction.customId !== customId) {
			return false;
		}

		if (filter && !(await filter(...args))) {
			return false;
		}

		return true;
	};
}

/**
 * Awaits one component interaction on a specific message.
 *
 * @internal
 */
export function awaitCommandComponent<
	ComponentType extends MessageComponentType,
	InGuild extends boolean,
>(
	message: Message<InGuild>,
	userId: string,
	options: CommandAwaitComponentOptions<ComponentType, InGuild>,
): Promise<CommandComponentInteraction<ComponentType, InGuild>> {
	const {
		componentType,
		customId,
		customIds,
		sameUser = true,
		filter,
		...collectorOptions
	} = options;

	return message.awaitMessageComponent<ComponentType>({
		...collectorOptions,
		componentType,
		filter: createComponentFilter(
			userId,
			sameUser,
			customId,
			customIds,
			filter,
		),
	});
}

/**
 * Creates a native Discord.js component collector on a specific message.
 *
 * @internal
 */
export function createCommandComponentCollector<
	ComponentType extends MessageComponentType,
	InGuild extends boolean,
>(
	message: Message<InGuild>,
	userId: string,
	options: CommandComponentCollectorOptions<ComponentType, InGuild>,
): CommandComponentCollector<ComponentType, InGuild> {
	const {
		componentType,
		customId,
		customIds,
		sameUser = true,
		filter,
		...collectorOptions
	} = options;

	return message.createMessageComponentCollector<ComponentType>({
		...collectorOptions,
		componentType,
		filter: createComponentFilter(
			userId,
			sameUser,
			customId,
			customIds,
			filter,
		),
	});
}

/**
 * Creates a native Discord.js message collector in the command channel.
 *
 * @internal
 */
export function createCommandMessageCollector(
	channel: CommandChannel,
	userId: string,
	options: CommandMessageCollectorOptions = {},
): MessageCollector {
	const collectorChannel = getMessageCollectorChannel(channel);

	const { sameUser = true, filter, ...collectorOptions } = options;

	return collectorChannel.createMessageCollector({
		...collectorOptions,
		filter: createMessageFilter(userId, sameUser, filter),
	});
}

/**
 * Awaits one message in the command channel.
 *
 * @internal
 */
export function awaitCommandMessage(
	channel: CommandChannel,
	userId: string,
	options: CommandAwaitMessageOptions = {},
): Promise<Message> {
	const collector = createCommandMessageCollector(channel, userId, {
		...options,
		max: 1,
	});

	return collector.next;
}

/**
 * Awaits one modal submission originating from an interaction command.
 *
 * @internal
 */
export function awaitCommandModal(
	interaction: ChatInputCommandInteraction | null,
	userId: string,
	options: CommandAwaitModalOptions,
): Promise<ModalSubmitInteraction> {
	if (!interaction) {
		throw new Error(
			"Modal submissions can only be awaited from interaction commands.",
		);
	}

	const { customId, sameUser = true, filter, ...collectorOptions } = options;

	return interaction.awaitModalSubmit({
		...collectorOptions,
		filter: createModalFilter(userId, sameUser, customId, filter),
	});
}
