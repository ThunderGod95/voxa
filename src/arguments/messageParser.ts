import type { Message } from "discord.js";
import { getRoleFromInput, getUserFromInput } from "../resolvers";
import { parseMessageSyntax } from "./messageSyntax";
import type {
	ArgumentParseResult,
	ArgumentSchema,
	ArgumentValueDefinition,
	ParsedArguments,
	ResolutionResult,
	ScalarValueDefinition,
} from "./types";
import { describeValueDefinition } from "./value";

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
		message: `\`${name}\` expects a textual value.`,
	};
}

/**
 * Resolves one scalar message-command value.
 */
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

/**
 * Resolves a semantic value, including heterogeneous unions.
 */
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
		message:
			`\`${name}\` must match one of: ` +
			`${describeValueDefinition(definition)}.`,
	};
}

function missingArgument(name: string): ArgumentParseResult<never> {
	return {
		success: false,
		error: {
			code: "MISSING_ARGUMENT",
			argument: name,
			message: `Missing required argument: \`${name}\`.`,
		},
	};
}

/**
 * Parses and resolves message-command arguments.
 *
 * CLI grammar is handled by messageSyntax.ts. This layer only maps raw
 * positionals/options onto their semantic Voxa value definitions.
 */
export async function parseMessageArguments<Schema extends ArgumentSchema>(
	schema: Schema,
	message: Message,
	tokens: readonly string[],
): Promise<ArgumentParseResult<ParsedArguments<Schema>>> {
	const syntax = parseMessageSyntax(schema, tokens);

	if (!syntax.success) {
		return syntax;
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

	let positionalIndex = 0;

	for (const [name, definition] of positionalDefinitions) {
		let input: string | undefined;

		if (definition.rest) {
			if (positionalIndex < syntax.value.positionals.length) {
				input = syntax.value.positionals.slice(positionalIndex).join(" ");
			}

			positionalIndex = syntax.value.positionals.length;
		} else {
			input = syntax.value.positionals[positionalIndex];

			if (input !== undefined) {
				positionalIndex++;
			}
		}

		if (input === undefined) {
			if (definition.required) {
				return missingArgument(name);
			}

			parsed[name] = null;
			continue;
		}

		const resolved = await resolveMessageValue(
			name,
			definition.value,
			input,
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

	if (positionalIndex < syntax.value.positionals.length) {
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

		const input = syntax.value.options[name];

		if (input === undefined) {
			if (definition.required) {
				return missingArgument(name);
			}

			parsed[name] = null;
			continue;
		}

		const resolved = await resolveMessageValue(
			name,
			definition.value,
			input,
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
