import type {
	ArgumentChoices,
	ArgumentValueDefinition,
	BooleanArgumentDefinition,
	BooleanArgumentOptions,
	BooleanOptionDefinition,
	BooleanOptionOptions,
	InferArgumentChoiceValue,
	IntegerArgumentDefinition,
	IntegerArgumentOptions,
	IntegerOptionDefinition,
	IntegerOptionOptions,
	MemberArgumentDefinition,
	MemberArgumentOptions,
	MemberOptionDefinition,
	MemberOptionOptions,
	NamedInputOptions,
	NamedOptionDefinition,
	NumberArgumentDefinition,
	NumberArgumentOptions,
	NumberOptionDefinition,
	NumberOptionOptions,
	PositionalArgumentDefinition,
	PositionalInputOptions,
	RoleArgumentDefinition,
	RoleArgumentOptions,
	RoleOptionDefinition,
	RoleOptionOptions,
	ScalarValueDefinition,
	StringArgumentDefinition,
	StringArgumentOptions,
	StringOptionDefinition,
	StringOptionOptions,
	TimeArgumentDefinition,
	TimeArgumentOptions,
	TimeOptionDefinition,
	TimeOptionOptions,
	TimezoneArgumentDefinition,
	TimezoneArgumentOptions,
	TimezoneOptionDefinition,
	TimezoneOptionOptions,
	UnionArgumentDefinition,
	UnionArgumentOptions,
	UnionOptionDefinition,
	UnionOptionOptions,
	UrlArgumentDefinition,
	UrlArgumentOptions,
	UrlOptionDefinition,
	UrlOptionOptions,
	UserArgumentDefinition,
	UserArgumentOptions,
	UserOptionDefinition,
	UserOptionOptions,
} from "./types";
import { value } from "./value";

function resolveRequired<Required extends boolean>(
	required: Required | undefined,
): Required {
	return (required ?? false) as Required;
}

function getChoices<
	Value extends string | number,
	Choices extends ArgumentChoices<Value> | undefined,
>(choices: ArgumentChoices<Value> | undefined): Choices | undefined {
	return choices as Choices | undefined;
}

function createPositionalDefinition<
	Value extends ArgumentValueDefinition,
	Required extends boolean,
>(
	valueDefinition: Value,
	options: PositionalInputOptions<Required> & {
		autocomplete?: PositionalArgumentDefinition<
			Value,
			Required
		>["autocomplete"];
	},
): PositionalArgumentDefinition<Value, Required> {
	return {
		placement: "positional",
		description: options.description,
		required: resolveRequired(options.required),
		rest: options.rest ?? false,
		value: valueDefinition,
		autocomplete: options.autocomplete,
	};
}

function createNamedDefinition<
	Value extends ArgumentValueDefinition,
	Required extends boolean,
>(
	valueDefinition: Value,
	options: NamedInputOptions<Required> & {
		autocomplete?: NamedOptionDefinition<Value, Required>["autocomplete"];
	},
): NamedOptionDefinition<Value, Required> {
	return {
		placement: "option",
		description: options.description,
		required: resolveRequired(options.required),
		aliases: options.aliases ?? [],
		value: valueDefinition,
		autocomplete: options.autocomplete,
	};
}

/**
 * Factory for positional command arguments.
 *
 * Positional placement only affects message commands. Discord application
 * command options are always named.
 */
export const argument = {
	/** Constructs a positional string argument. */
	string<
		const Required extends boolean = false,
		const Choices extends ArgumentChoices<string> | undefined = undefined,
	>(
		options: StringArgumentOptions<Required, Choices>,
	): StringArgumentDefinition<
		Required,
		InferArgumentChoiceValue<Choices, string>
	> {
		const valueDefinition = value.string<Choices>({
			minLength: options.minLength,
			maxLength: options.maxLength,
			choices: getChoices<string, Choices>(options.choices),
			aliases: options.aliases,
		});

		return createPositionalDefinition(valueDefinition, options);
	},

	/** Constructs a positional integer argument. */
	integer<
		const Required extends boolean = false,
		const Choices extends ArgumentChoices<number> | undefined = undefined,
	>(
		options: IntegerArgumentOptions<Required, Choices>,
	): IntegerArgumentDefinition<
		Required,
		InferArgumentChoiceValue<Choices, number>
	> {
		const valueDefinition = value.integer<Choices>({
			min: options.min,
			max: options.max,
			choices: getChoices<number, Choices>(options.choices),
		});

		return createPositionalDefinition(valueDefinition, options);
	},

	/** Constructs a positional number argument. */
	number<
		const Required extends boolean = false,
		const Choices extends ArgumentChoices<number> | undefined = undefined,
	>(
		options: NumberArgumentOptions<Required, Choices>,
	): NumberArgumentDefinition<
		Required,
		InferArgumentChoiceValue<Choices, number>
	> {
		const valueDefinition = value.number<Choices>({
			min: options.min,
			max: options.max,
			choices: getChoices<number, Choices>(options.choices),
		});

		return createPositionalDefinition(valueDefinition, options);
	},

	/** Constructs a positional boolean argument. */
	boolean<const Required extends boolean = false>(
		options: BooleanArgumentOptions<Required>,
	): BooleanArgumentDefinition<Required> {
		return createPositionalDefinition(value.boolean(), options);
	},

	/** Constructs a positional Discord user argument. */
	user<const Required extends boolean = false>(
		options: UserArgumentOptions<Required>,
	): UserArgumentDefinition<Required> {
		return createPositionalDefinition(value.user(), options);
	},

	/** Constructs a positional Discord guild-member argument. */
	member<const Required extends boolean = false>(
		options: MemberArgumentOptions<Required>,
	): MemberArgumentDefinition<Required> {
		return createPositionalDefinition(value.member(), options);
	},

	/** Constructs a positional Discord role argument. */
	role<const Required extends boolean = false>(
		options: RoleArgumentOptions<Required>,
	): RoleArgumentDefinition<Required> {
		return createPositionalDefinition(
			value.role({
				allowedRoleIds: options.allowedRoleIds,
			}),
			options,
		);
	},

	/** Constructs a positional URL argument. */
	url<const Required extends boolean = false>(
		options: UrlArgumentOptions<Required>,
	): UrlArgumentDefinition<Required> {
		return createPositionalDefinition(
			value.url({
				pattern: options.pattern,
				hostname: options.hostname,
				protocol: options.protocol,
			}),
			options,
		);
	},

	/** Constructs a positional timezone argument. */
	timezone<const Required extends boolean = false>(
		options: TimezoneArgumentOptions<Required>,
	): TimezoneArgumentDefinition<Required> {
		return createPositionalDefinition(value.timezone(), options);
	},

	/** Constructs a positional natural-language time argument. */
	time<const Required extends boolean = false>(
		options: TimeArgumentOptions<Required>,
	): TimeArgumentDefinition<Required> {
		return createPositionalDefinition(
			value.time({
				reference: options.reference,
				timezone: options.timezone,
				forwardDate: options.forwardDate,
				strict: options.strict,
			}),
			options,
		);
	},

	/**
	 * Constructs a positional union argument.
	 *
	 * Message commands try variants in declaration order.
	 */
	union<
		const Required extends boolean = false,
		const Variants extends
			readonly ScalarValueDefinition[] = readonly ScalarValueDefinition[],
	>(
		options: UnionArgumentOptions<Required, Variants>,
	): UnionArgumentDefinition<Required, Variants> {
		return createPositionalDefinition(
			value.union(options.variants, {
				slashVariant: options.slashVariant,
			}),
			options,
		);
	},
};

/**
 * Factory for named message-command options.
 *
 * Message commands use unordered syntax:
 *
 * --name=value
 *
 * Boolean values may additionally be supplied as bare flags:
 *
 * --silent
 */
export const option = {
	/** Constructs a named string option. */
	string<
		const Required extends boolean = false,
		const Choices extends ArgumentChoices<string> | undefined = undefined,
	>(
		options: StringOptionOptions<Required, Choices>,
	): StringOptionDefinition<
		Required,
		InferArgumentChoiceValue<Choices, string>
	> {
		const valueDefinition = value.string<Choices>({
			minLength: options.minLength,
			maxLength: options.maxLength,
			choices: getChoices<string, Choices>(options.choices),
			aliases: options.aliases,
		});

		return createNamedDefinition(valueDefinition, options);
	},

	/** Constructs a named integer option. */
	integer<
		const Required extends boolean = false,
		const Choices extends ArgumentChoices<number> | undefined = undefined,
	>(
		options: IntegerOptionOptions<Required, Choices>,
	): IntegerOptionDefinition<
		Required,
		InferArgumentChoiceValue<Choices, number>
	> {
		const valueDefinition = value.integer<Choices>({
			min: options.min,
			max: options.max,
			choices: getChoices<number, Choices>(options.choices),
		});

		return createNamedDefinition(valueDefinition, options);
	},

	/** Constructs a named number option. */
	number<
		const Required extends boolean = false,
		const Choices extends ArgumentChoices<number> | undefined = undefined,
	>(
		options: NumberOptionOptions<Required, Choices>,
	): NumberOptionDefinition<
		Required,
		InferArgumentChoiceValue<Choices, number>
	> {
		const valueDefinition = value.number<Choices>({
			min: options.min,
			max: options.max,
			choices: getChoices<number, Choices>(options.choices),
		});

		return createNamedDefinition(valueDefinition, options);
	},

	/** Constructs a named boolean option. */
	boolean<const Required extends boolean = false>(
		options: BooleanOptionOptions<Required>,
	): BooleanOptionDefinition<Required> {
		return createNamedDefinition(value.boolean(), options);
	},

	/** Constructs a named Discord user option. */
	user<const Required extends boolean = false>(
		options: UserOptionOptions<Required>,
	): UserOptionDefinition<Required> {
		return createNamedDefinition(value.user(), options);
	},

	/** Constructs a named Discord guild-member option. */
	member<const Required extends boolean = false>(
		options: MemberOptionOptions<Required>,
	): MemberOptionDefinition<Required> {
		return createNamedDefinition(value.member(), options);
	},

	/** Constructs a named Discord role option. */
	role<const Required extends boolean = false>(
		options: RoleOptionOptions<Required>,
	): RoleOptionDefinition<Required> {
		return createNamedDefinition(
			value.role({
				allowedRoleIds: options.allowedRoleIds,
			}),
			options,
		);
	},

	/** Constructs a named URL option. */
	url<const Required extends boolean = false>(
		options: UrlOptionOptions<Required>,
	): UrlOptionDefinition<Required> {
		return createNamedDefinition(
			value.url({
				pattern: options.pattern,
				hostname: options.hostname,
				protocol: options.protocol,
			}),
			options,
		);
	},

	/** Constructs a named timezone option. */
	timezone<const Required extends boolean = false>(
		options: TimezoneOptionOptions<Required>,
	): TimezoneOptionDefinition<Required> {
		return createNamedDefinition(value.timezone(), options);
	},

	/** Constructs a named natural-language time option. */
	time<const Required extends boolean = false>(
		options: TimeOptionOptions<Required>,
	): TimeOptionDefinition<Required> {
		return createNamedDefinition(
			value.time({
				reference: options.reference,
				timezone: options.timezone,
				forwardDate: options.forwardDate,
				strict: options.strict,
			}),
			options,
		);
	},

	/**
	 * Constructs a named union option.
	 *
	 * Message commands try variants in declaration order.
	 */
	union<
		const Required extends boolean = false,
		const Variants extends
			readonly ScalarValueDefinition[] = readonly ScalarValueDefinition[],
	>(
		options: UnionOptionOptions<Required, Variants>,
	): UnionOptionDefinition<Required, Variants> {
		return createNamedDefinition(
			value.union(options.variants, {
				slashVariant: options.slashVariant,
			}),
			options,
		);
	},
};
