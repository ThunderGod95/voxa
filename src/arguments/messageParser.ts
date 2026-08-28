import {
	ArgumentStream,
	Lexer,
	Parser,
	type ParserResult,
	PrefixedStrategy,
} from "@sapphire/lexure";
import { inlineCode, type Message } from "discord.js";
import { getRoleFromInput, getUserFromInput } from "@/resolvers";
import type {
	ArgumentParseResult,
	ArgumentSchema,
	ArgumentValueDefinition,
	NamedOptionDefinition,
	ParsedArguments,
	ResolutionResult,
	ScalarValueDefinition,
} from "./types";
import { describeValueDefinition, isMessageFlagValueDefinition } from "./value";

const messageLexer = new Lexer({
	quotes: [
		['"', '"'],
		["'", "'"],
		["“", "”"],
		["「", "」"],
		["«", "»"],
	],
});

const messageParser = new Parser(new PrefixedStrategy(["--", "/"], ["=", ":"]));

function createArgumentStream(input: string): ArgumentStream {
	return new ArgumentStream(messageParser.run(messageLexer.run(input.trim())));
}

function requiresStringInput(
	name: string,
	input: string | boolean,
): ResolutionResult<string> {
	if (typeof input === "string") {
		return {
			success: true,
			value: input,
		};
	}

	return {
		success: false,
		code: "INVALID_ARGUMENT",
		message: `${inlineCode(name)} expects a textual value.`,
	};
}

async function resolveScalarMessageValue(
	name: string,
	definition: ScalarValueDefinition,
	input: string | boolean,
	message: Message,
): Promise<ResolutionResult<unknown>> {
	let rawValue: unknown = input;

	switch (definition.type) {
		case "string": {
			const stringInput = requiresStringInput(name, input);

			if (!stringInput.success) {
				return stringInput;
			}

			rawValue = definition.aliases?.[stringInput.value] ?? stringInput.value;

			break;
		}

		case "integer":
		case "number":
		case "boolean":
		case "url":
		case "timezone":
		case "time":
			break;

		case "user": {
			const stringInput = requiresStringInput(name, input);

			if (!stringInput.success) {
				return stringInput;
			}

			const user = await getUserFromInput(stringInput.value, message);

			if (!user) {
				return {
					success: false,
					code: "ARGUMENT_NOT_FOUND",
					message: `Could not find a user for \`${name}\`.`,
				};
			}

			rawValue = user;
			break;
		}

		case "member": {
			const stringInput = requiresStringInput(name, input);

			if (!stringInput.success) {
				return stringInput;
			}

			if (!message.guild) {
				return {
					success: false,
					code: "INVALID_ARGUMENT",
					message: `\`${name}\` can only be used in a server.`,
				};
			}

			const user = await getUserFromInput(stringInput.value, message);

			if (!user) {
				return {
					success: false,
					code: "ARGUMENT_NOT_FOUND",
					message: `Could not find a member for \`${name}\`.`,
				};
			}

			const member = await message.guild.members
				.fetch(user.id)
				.catch(() => null);

			if (!member) {
				return {
					success: false,
					code: "ARGUMENT_NOT_FOUND",
					message: "That user is not a member of this server.",
				};
			}

			rawValue = member;
			break;
		}

		case "role": {
			const stringInput = requiresStringInput(name, input);

			if (!stringInput.success) {
				return stringInput;
			}

			if (!message.guild) {
				return {
					success: false,
					code: "INVALID_ARGUMENT",
					message: `\`${name}\` can only be used in a server.`,
				};
			}

			const role = getRoleFromInput(
				stringInput.value,
				message.guild,
				definition.allowedRoleIds,
			);

			if (!role) {
				return {
					success: false,
					code: "ARGUMENT_NOT_FOUND",
					message: `Could not find a role for \`${name}\`.`,
				};
			}

			rawValue = role;
			break;
		}
	}

	const validation = await definition._schema.safeParseAsync(rawValue);

	if (!validation.success) {
		return {
			success: false,
			code: "INVALID_ARGUMENT",
			message:
				`\`${name}\`: ` +
				(validation.error.issues[0]?.message ?? "Invalid argument."),
		};
	}

	return {
		success: true,
		value: validation.data,
	};
}

async function resolveMessageValue(
	name: string,
	definition: ArgumentValueDefinition,
	input: string | boolean,
	message: Message,
): Promise<ResolutionResult<unknown>> {
	if (definition.type !== "union") {
		return resolveScalarMessageValue(name, definition, input, message);
	}

	for (const variant of definition.variants) {
		const resolved = await resolveScalarMessageValue(
			name,
			variant,
			input,
			message,
		);

		if (resolved.success) {
			return resolved;
		}
	}

	return {
		success: false,
		code: "INVALID_ARGUMENT",
		message: `${inlineCode(name)} must match one of ${describeValueDefinition(definition)}`,
	};
}

function missingArgument(name: string): ArgumentParseResult<never> {
	return {
		success: false,
		error: {
			code: "MISSING_ARGUMENT",
			argument: name,
			message: `Missing required argument: ${inlineCode(name)}.`,
		},
	};
}

function getMessageOptionKeys(
	name: string,
	definition: NamedOptionDefinition,
): readonly string[] {
	return [name, ...definition.aliases];
}

/**
 * Returns every unordered option/flag name accepted by this command.
 *
 * Lexure deliberately parses unordered syntax independently of the command
 * schema, so we validate the resulting names against Voxa's schema afterward.
 */
function getKnownMessageOptionKeys(
	schema: ArgumentSchema,
): ReadonlySet<string> {
	const keys = new Set<string>();

	for (const [name, definition] of Object.entries(schema)) {
		if (definition.placement !== "option") {
			continue;
		}

		for (const key of getMessageOptionKeys(name, definition)) {
			keys.add(key);
		}
	}

	return keys;
}

/**
 * Rejects flags/options that Lexure recognized syntactically but that are not
 * declared by this command.
 */
function validateUnorderedArguments(
	schema: ArgumentSchema,
	results: ParserResult,
): ArgumentParseResult<void> {
	const knownKeys = getKnownMessageOptionKeys(schema);

	for (const key of results.flags) {
		if (knownKeys.has(key)) {
			continue;
		}

		return {
			success: false,
			error: {
				code: "INVALID_SYNTAX",
				message: `Unknown option: ${inlineCode(`--${key}`)}.`,
			},
		};
	}

	for (const key of results.options.keys()) {
		if (knownKeys.has(key)) {
			continue;
		}

		return {
			success: false,
			error: {
				code: "INVALID_SYNTAX",
				message: `Unknown option: ${inlineCode(`--${key}`)}.`,
			},
		};
	}

	return {
		success: true,
		value: undefined,
	};
}

/**
 * Reads one named Voxa option from Lexure's unordered parse result.
 */
function readNamedInput(
	name: string,
	definition: NamedOptionDefinition,
	results: ParserResult,
): ArgumentParseResult<string | boolean | undefined> {
	const keys = getMessageOptionKeys(name, definition);

	let flagCount = 0;
	let optionCount = 0;
	let optionValue: string | undefined;

	for (const key of keys) {
		if (results.flags.has(key)) {
			flagCount++;
		}

		const values = results.options.get(key);

		if (values === undefined) {
			continue;
		}

		optionCount += values.length;

		if (values.length > 0) {
			optionValue = values[values.length - 1];
		}
	}

	const occurrenceCount = flagCount + optionCount;

	if (occurrenceCount === 0) {
		return {
			success: true,
			value: undefined,
		};
	}

	if (occurrenceCount > 1) {
		return {
			success: false,
			error: {
				code: "DUPLICATE_OPTION",
				argument: name,
				message: `Option \`${name}\` was provided more than once.`,
			},
		};
	}

	if (flagCount === 1) {
		if (!isMessageFlagValueDefinition(definition.value)) {
			return {
				success: false,
				error: {
					code: "INVALID_SYNTAX",
					argument: name,
					message: `Option \`--${name}\` requires a value.`,
				},
			};
		}

		return {
			success: true,
			value: true,
		};
	}

	if (optionValue === undefined) {
		return {
			success: false,
			error: {
				code: "INVALID_SYNTAX",
				argument: name,
				message: `Option \`--${name}\` requires a value.`,
			},
		};
	}

	return {
		success: true,
		value: optionValue,
	};
}

/**
 * Parses and resolves message-command arguments.
 */
export async function parseMessageArguments<Schema extends ArgumentSchema>(
	schema: Schema,
	message: Message,
	input: string,
): Promise<ArgumentParseResult<ParsedArguments<Schema>>> {
	const stream = createArgumentStream(input);

	const unorderedValidation = validateUnorderedArguments(
		schema,
		stream.results,
	);

	if (!unorderedValidation.success) {
		return unorderedValidation;
	}

	const parsed: Record<string, unknown> = {};

	const positionalDefinitions = Object.entries(schema).filter(
		(
			entry,
		): entry is [
			string,
			Extract<ArgumentSchema[string], { placement: "positional" }>,
		] => entry[1].placement === "positional",
	);

	for (const [name, definition] of positionalDefinitions) {
		let inputValue: string | undefined;

		if (definition.rest) {
			const remaining = stream.many().unwrapOr([]);

			if (remaining.length > 0) {
				inputValue = remaining.map((parameter) => parameter.value).join(" ");
			}
		} else {
			inputValue = stream.single().unwrapOr(undefined);
		}

		if (inputValue === undefined) {
			if (definition.required) {
				return missingArgument(name);
			}

			parsed[name] = null;
			continue;
		}

		const resolved = await resolveMessageValue(
			name,
			definition.value,
			inputValue,
			message,
		);

		if (!resolved.success) {
			return {
				success: false,
				error: {
					code: resolved.code,
					argument: name,
					message: resolved.message,
				},
			};
		}

		parsed[name] = resolved.value;
	}

	if (!stream.finished) {
		return {
			success: false,
			error: {
				code: "TOO_MANY_ARGUMENTS",
				message: "Too many positional arguments were provided.",
			},
		};
	}

	for (const [name, definition] of Object.entries(schema)) {
		if (definition.placement !== "option") {
			continue;
		}

		const inputValue = readNamedInput(name, definition, stream.results);

		if (!inputValue.success) {
			return inputValue;
		}

		if (inputValue.value === undefined) {
			if (definition.required) {
				return missingArgument(name);
			}

			parsed[name] = null;
			continue;
		}

		const resolved = await resolveMessageValue(
			name,
			definition.value,
			inputValue.value,
			message,
		);

		if (!resolved.success) {
			return {
				success: false,
				error: {
					code: resolved.code,
					argument: name,
					message: resolved.message,
				},
			};
		}

		parsed[name] = resolved.value;
	}

	return {
		success: true,
		value: parsed as ParsedArguments<Schema>,
	};
}
