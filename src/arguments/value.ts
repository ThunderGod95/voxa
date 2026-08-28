import type { GuildMember, Role, User } from "discord.js";
import { z } from "zod";
import { getArgumentChoiceValues } from "./choices";
import { parseNaturalTime } from "./timeParser";
import { resolveTimezone } from "./timezoneParser";
import type {
	ArgumentChoices,
	ArgumentChoiceValue,
	ArgumentValueDefinition,
	BooleanValueDefinition,
	InferArgumentChoiceValue,
	IntegerValueDefinition,
	IntegerValueOptions,
	MemberValueDefinition,
	NumberValueDefinition,
	NumberValueOptions,
	RoleValueDefinition,
	RoleValueOptions,
	ScalarValueDefinition,
	StringValueDefinition,
	StringValueOptions,
	TimeValueDefinition,
	TimeValueOptions,
	TimezoneValueDefinition,
	UnionValueDefinition,
	UnionValueOptions,
	UrlValueDefinition,
	UrlValueOptions,
	UserValueDefinition,
} from "./types";

function applyChoices<Value extends ArgumentChoiceValue>(
	schema: z.ZodType<Value>,
	choices: ArgumentChoices<Value> | undefined,
): z.ZodType<Value> {
	if (choices === undefined) {
		return schema;
	}

	const values = getArgumentChoiceValues(choices);
	const allowedValues = new Set<Value>(values);

	return schema.refine((current) => allowedValues.has(current), {
		message: `Must be one of: ${values
			.map((value) => `\`${String(value).replaceAll("`", "\\`")}\``)
			.join(", ")}.`,
	});
}

/**
 * Factory for constructing semantic command values independently from their
 * message-command placement.
 */
export const value = {
	/**
	 * Constructs a string value.
	 */
	string<const Choices extends ArgumentChoices<string> | undefined = undefined>(
		options: StringValueOptions<Choices> = {} as StringValueOptions<Choices>,
	): StringValueDefinition<InferArgumentChoiceValue<Choices, string>> {
		let schema = z.string({
			error: "Must be a string.",
		});

		if (options.minLength !== undefined) {
			schema = schema.min(options.minLength, {
				message: `Must contain at least ${options.minLength} characters.`,
			});
		}

		if (options.maxLength !== undefined) {
			schema = schema.max(options.maxLength, {
				message: `Cannot contain more than ${options.maxLength} characters.`,
			});
		}

		type Output = InferArgumentChoiceValue<Choices, string>;

		const finalSchema = applyChoices(
			schema,
			options.choices,
		) as z.ZodType<Output>;

		return {
			type: "string",
			minLength: options.minLength,
			maxLength: options.maxLength,
			choices: options.choices,
			aliases: options.aliases,
			_schema: finalSchema,
		};
	},

	/**
	 * Constructs an integer value.
	 */
	integer<
		const Choices extends ArgumentChoices<number> | undefined = undefined,
	>(
		options: IntegerValueOptions<Choices> = {} as IntegerValueOptions<Choices>,
	): IntegerValueDefinition<InferArgumentChoiceValue<Choices, number>> {
		let numberSchema = z
			.number({
				error: "Must be a valid number.",
			})
			.int({
				message: "Must be a whole number.",
			});

		if (options.min !== undefined) {
			numberSchema = numberSchema.min(options.min, {
				message: `Must be at least ${options.min}.`,
			});
		}

		if (options.max !== undefined) {
			numberSchema = numberSchema.max(options.max, {
				message: `Cannot be more than ${options.max}.`,
			});
		}

		const schema = z.preprocess((rawValue) => {
			if (typeof rawValue === "number") {
				return rawValue;
			}

			if (typeof rawValue === "string" && /^[+-]?\d+$/u.test(rawValue.trim())) {
				return Number(rawValue);
			}

			return rawValue;
		}, numberSchema);

		type Output = InferArgumentChoiceValue<Choices, number>;

		const finalSchema = applyChoices(
			schema,
			options.choices,
		) as z.ZodType<Output>;

		return {
			type: "integer",
			min: options.min,
			max: options.max,
			choices: options.choices,
			_schema: finalSchema,
		};
	},

	/**
	 * Constructs a floating-point number value.
	 */
	number<const Choices extends ArgumentChoices<number> | undefined = undefined>(
		options: NumberValueOptions<Choices> = {} as NumberValueOptions<Choices>,
	): NumberValueDefinition<InferArgumentChoiceValue<Choices, number>> {
		let numberSchema = z.number({
			error: "Must be a valid number.",
		});

		if (options.min !== undefined) {
			numberSchema = numberSchema.min(options.min, {
				message: `Must be at least ${options.min}.`,
			});
		}

		if (options.max !== undefined) {
			numberSchema = numberSchema.max(options.max, {
				message: `Cannot be more than ${options.max}.`,
			});
		}

		const schema = z.preprocess((rawValue) => {
			if (typeof rawValue === "number") {
				return rawValue;
			}

			if (typeof rawValue === "string" && rawValue.trim().length > 0) {
				const parsed = Number(rawValue);

				if (!Number.isNaN(parsed)) {
					return parsed;
				}
			}

			return rawValue;
		}, numberSchema);

		type Output = InferArgumentChoiceValue<Choices, number>;

		const finalSchema = applyChoices(
			schema,
			options.choices,
		) as z.ZodType<Output>;

		return {
			type: "number",
			min: options.min,
			max: options.max,
			choices: options.choices,
			_schema: finalSchema,
		};
	},

	/**
	 * Constructs a boolean value.
	 */
	boolean(): BooleanValueDefinition {
		const trueValues = new Set([
			"true",
			"yes",
			"y",
			"1",
			"on",
			"enable",
			"enabled",
		]);

		const falseValues = new Set([
			"false",
			"no",
			"n",
			"0",
			"off",
			"disable",
			"disabled",
		]);

		const schema = z.preprocess(
			(rawValue) => {
				if (typeof rawValue === "boolean") {
					return rawValue;
				}

				if (typeof rawValue === "string") {
					const normalized = rawValue.trim().toLowerCase();

					if (trueValues.has(normalized)) {
						return true;
					}

					if (falseValues.has(normalized)) {
						return false;
					}
				}

				return rawValue;
			},
			z.boolean({ error: "Must be true or false." }),
		);

		return {
			type: "boolean",
			_schema: schema,
		};
	},

	/**
	 * Constructs a Discord user value.
	 */
	user(): UserValueDefinition {
		const schema = z.custom<User>(
			(rawValue) =>
				rawValue !== null && typeof rawValue === "object" && "id" in rawValue,
			{
				message: "Could not resolve a valid user.",
			},
		);

		return {
			type: "user",
			_schema: schema,
		};
	},

	/**
	 * Constructs a Discord guild-member value.
	 */
	member(): MemberValueDefinition {
		const schema = z.custom<GuildMember>(
			(rawValue) =>
				rawValue !== null && typeof rawValue === "object" && "user" in rawValue,
			{
				message: "Could not resolve a valid server member.",
			},
		);

		return {
			type: "member",
			_schema: schema,
		};
	},

	/**
	 * Constructs a Discord role value.
	 */
	role(options: RoleValueOptions = {}): RoleValueDefinition {
		const schema = z.custom<Role>(
			(rawValue) =>
				rawValue !== null && typeof rawValue === "object" && "name" in rawValue,
			{
				message: "Could not resolve a valid role.",
			},
		);

		return {
			type: "role",
			allowedRoleIds: options.allowedRoleIds,
			_schema: schema,
		};
	},

	/**
	 * Constructs a URL value.
	 */
	url(options: UrlValueOptions = {}): UrlValueDefinition {
		const schema = z
			.url({
				pattern: options.pattern,
				hostname: options.hostname,
				protocol: options.protocol,
				error: "Must be a valid URL.",
			})
			.transform((current) => new URL(current));

		return {
			type: "url",
			pattern: options.pattern,
			hostname: options.hostname,
			protocol: options.protocol,
			_schema: schema,
		};
	},

	/**
	 * Constructs an IANA timezone value.
	 */
	timezone(): TimezoneValueDefinition {
		const schema = z
			.string({
				error: "Must be a timezone.",
			})
			.transform((current, context) => {
				const timezone = resolveTimezone(current);

				if (!timezone) {
					context.addIssue({
						code: "custom",
						message: "Could not resolve a valid timezone.",
					});

					return z.NEVER;
				}

				return timezone;
			});

		return {
			type: "timezone",
			_schema: schema,
		};
	},

	/**
	 * Constructs a natural-language date/time value.
	 */
	time(options: TimeValueOptions = {}): TimeValueDefinition {
		const resolvedTimezone = options.timezone
			? resolveTimezone(options.timezone)
			: null;

		if (options.timezone && !resolvedTimezone) {
			throw new Error(`Invalid time argument timezone: "${options.timezone}".`);
		}

		const timezone = resolvedTimezone ?? undefined;
		const forwardDate = options.forwardDate ?? false;
		const strict = options.strict ?? false;

		const schema = z
			.string({
				error: "Must be a date or time expression.",
			})
			.transform((current, context) => {
				const reference =
					typeof options.reference === "function"
						? options.reference()
						: options.reference;

				const parsed = parseNaturalTime(current, {
					reference,
					timezone,
					forwardDate,
					strict,
				});

				if (!parsed) {
					context.addIssue({
						code: "custom",
						message: "Could not parse a valid date or time.",
					});

					return z.NEVER;
				}

				return parsed;
			});

		return {
			type: "time",
			timezone,
			forwardDate,
			strict,
			_schema: schema,
		};
	},

	/**
	 * Constructs a semantic union.
	 *
	 * Prefix commands try variants in declaration order.
	 */
	union<const Variants extends readonly ScalarValueDefinition[]>(
		variants: Variants,
		options: UnionValueOptions = {},
	): UnionValueDefinition<Variants> {
		return {
			type: "union",
			variants,
			slashVariant: options.slashVariant ?? 0,
		};
	},
};

/**
 * Returns the scalar representation used by Discord for a semantic value.
 */
export function getSlashValueDefinition(
	definition: ArgumentValueDefinition,
): ScalarValueDefinition {
	if (definition.type !== "union") {
		return definition;
	}

	const variant = definition.variants[definition.slashVariant];

	if (!variant) {
		throw new Error(
			`Union slash variant ${definition.slashVariant} is out of range.`,
		);
	}

	return variant;
}

/**
 * Returns whether a message-command value may be represented as a bare Lexure
 * flag.
 *
 * Heterogeneous unions require explicit values. A union is flag-compatible
 * only when every possible variant is boolean.
 */
export function isMessageFlagValueDefinition(
	definition: ArgumentValueDefinition,
): boolean {
	if (definition.type !== "union") {
		return definition.type === "boolean";
	}

	return (
		definition.variants.length > 0 &&
		definition.variants.every((variant) => variant.type === "boolean")
	);
}

/**
 * Returns whether Discord supports autocomplete for this scalar type.
 */
export function isAutocompletableValueDefinition(
	definition: ScalarValueDefinition,
): boolean {
	return (
		definition.type === "string" ||
		definition.type === "integer" ||
		definition.type === "number" ||
		definition.type === "timezone" ||
		definition.type === "time" ||
		definition.type === "url"
	);
}

/**
 * Returns a concise human-readable value type for usage and error messages.
 */
export function describeValueDefinition(
	definition: ArgumentValueDefinition,
): string {
	if (definition.type === "union") {
		return definition.variants
			.map((variant) => describeValueDefinition(variant))
			.join("|");
	}

	switch (definition.type) {
		case "string":
			if (definition.choices !== undefined) {
				return getArgumentChoiceValues(definition.choices)
					.map(String)
					.join("|");
			}

			return "string";

		case "integer":
			if (definition.choices !== undefined) {
				return getArgumentChoiceValues(definition.choices)
					.map(String)
					.join("|");
			}

			return "integer";

		case "number":
			if (definition.choices !== undefined) {
				return getArgumentChoiceValues(definition.choices)
					.map(String)
					.join("|");
			}

			return "number";

		case "boolean":
			return "boolean";

		case "user":
			return "user";

		case "member":
			return "member";

		case "role":
			return "role";

		case "url":
			return "url";

		case "timezone":
			return "timezone";

		case "time":
			return "time";
	}
}
