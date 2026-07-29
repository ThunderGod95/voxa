import { parseArgs } from "node:util";
import type {
	ArgumentParseResult,
	ArgumentSchema,
	NamedOptionDefinition,
} from "./types";
import { getMessageOptionKind } from "./value";

interface CompiledOption {
	name: string;
	definition: NamedOptionDefinition;
	kind: "string" | "boolean";
}

interface CliOptionConfiguration {
	type: "string" | "boolean";
	short?: string;
}

interface CompiledMessageSyntax {
	byLongName: ReadonlyMap<string, CompiledOption>;
	byShortName: ReadonlyMap<string, CompiledOption>;
	options: Record<string, CliOptionConfiguration>;
}

export interface ParsedMessageSyntax {
	positionals: string[];
	options: Readonly<Record<string, string | boolean>>;
}

const TRUE_VALUES = new Set([
	"true",
	"yes",
	"y",
	"1",
	"on",
	"enable",
	"enabled",
]);

const FALSE_VALUES = new Set([
	"false",
	"no",
	"n",
	"0",
	"off",
	"disable",
	"disabled",
]);

const NEGATIVE_NUMBER_PATTERN = /^-(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/iu;

function parseBooleanText(value: string): boolean | null {
	const normalized = value.trim().toLowerCase();

	if (TRUE_VALUES.has(normalized)) {
		return true;
	}

	if (FALSE_VALUES.has(normalized)) {
		return false;
	}

	return null;
}

function compileMessageSyntax(schema: ArgumentSchema): CompiledMessageSyntax {
	const byLongName = new Map<string, CompiledOption>();
	const byShortName = new Map<string, CompiledOption>();

	const options: Record<string, CliOptionConfiguration> = {};

	for (const [name, definition] of Object.entries(schema)) {
		if (definition.placement !== "option") {
			continue;
		}

		const compiled: CompiledOption = {
			name,
			definition,
			kind: getMessageOptionKind(definition.value),
		};

		byLongName.set(name, compiled);

		for (const alias of definition.longAliases) {
			byLongName.set(alias, compiled);
		}

		if (definition.short !== undefined) {
			byShortName.set(definition.short, compiled);
		}

		options[name] = {
			type: compiled.kind,
			...(definition.short !== undefined
				? {
						short: definition.short,
					}
				: {}),
		};
	}

	return {
		byLongName,
		byShortName,
		options,
	};
}

function invalidBooleanValue(
	name: string,
	rawValue: string,
): ArgumentParseResult<never> {
	return {
		success: false,
		error: {
			code: "INVALID_ARGUMENT",
			argument: name,
			message:
				`\`${name}\` expects a boolean value, but received ` +
				`\`${rawValue}\`.`,
		},
	};
}

function normalizeColonOption(
	option: CompiledOption,
	rawValue: string,
): ArgumentParseResult<string[]> {
	if (option.kind === "string") {
		return {
			success: true,
			value: [`--${option.name}=${rawValue}`],
		};
	}

	const booleanValue = parseBooleanText(rawValue);

	if (booleanValue === null) {
		return invalidBooleanValue(option.name, rawValue);
	}

	return {
		success: true,
		value: [booleanValue ? `--${option.name}` : `--no-${option.name}`],
	};
}

function normalizeLongOption(
	option: CompiledOption,
	rawValue: string | undefined,
	negative: boolean,
): ArgumentParseResult<{
	tokens: string[];
	consumesFollowingValue: boolean;
}> {
	if (negative) {
		if (option.kind !== "boolean") {
			return {
				success: false,
				error: {
					code: "INVALID_SYNTAX",
					argument: option.name,
					message: `\`--no-${option.name}\` is only valid for boolean options.`,
				},
			};
		}

		if (rawValue !== undefined) {
			return {
				success: false,
				error: {
					code: "INVALID_SYNTAX",
					argument: option.name,
					message: `\`--no-${option.name}\` cannot also specify an inline value.`,
				},
			};
		}

		return {
			success: true,
			value: {
				tokens: [`--no-${option.name}`],
				consumesFollowingValue: false,
			},
		};
	}

	if (option.kind === "string") {
		if (rawValue !== undefined) {
			return {
				success: true,
				value: {
					tokens: [`--${option.name}=${rawValue}`],
					consumesFollowingValue: false,
				},
			};
		}

		return {
			success: true,
			value: {
				tokens: [`--${option.name}`],
				consumesFollowingValue: true,
			},
		};
	}

	if (rawValue === undefined) {
		return {
			success: true,
			value: {
				tokens: [`--${option.name}`],
				consumesFollowingValue: false,
			},
		};
	}

	const booleanValue = parseBooleanText(rawValue);

	if (booleanValue === null) {
		return invalidBooleanValue(option.name, rawValue) as ArgumentParseResult<{
			tokens: string[];
			consumesFollowingValue: boolean;
		}>;
	}

	return {
		success: true,
		value: {
			tokens: [booleanValue ? `--${option.name}` : `--no-${option.name}`],
			consumesFollowingValue: false,
		},
	};
}

interface NormalizedSyntax {
	tokens: string[];
	literalTokens: ReadonlyMap<string, string>;
}

/**
 * Rewrites Voxa syntax into argv understood by `util.parseArgs`.
 *
 * Supported named forms:
 *
 * amount:500
 * --amount 500
 * --amount=500
 * -a 500
 *
 * Boolean forms:
 *
 * silent:true
 * silent:false
 * --silent
 * --no-silent
 * -s
 *
 * Unknown `name:value` tokens remain positional. Only declared named options
 * and their aliases trigger colon syntax.
 */
function normalizeMessageSyntax(
	compiled: CompiledMessageSyntax,
	tokens: readonly string[],
): ArgumentParseResult<NormalizedSyntax> {
	const normalized: string[] = [];
	const literalTokens = new Map<string, string>();

	let nextTokenIsOptionValue = false;

	const preserveLiteral = (value: string, index: number): string => {
		const placeholder = `\u0001voxa-literal-${index}\u0001`;
		literalTokens.set(placeholder, value);
		return placeholder;
	};

	for (let index = 0; index < tokens.length; index++) {
		const token = tokens[index];

		if (token === undefined) {
			continue;
		}

		if (nextTokenIsOptionValue) {
			normalized.push(token);
			nextTokenIsOptionValue = false;
			continue;
		}

		if (token === "--") {
			normalized.push(...tokens.slice(index));
			break;
		}

		/*
		 * Preferred Voxa syntax: name:value
		 */
		const colonIndex = token.indexOf(":");

		if (colonIndex > 0) {
			const suppliedName = token.slice(0, colonIndex);
			const option = compiled.byLongName.get(suppliedName);

			if (option) {
				const rawValue = token.slice(colonIndex + 1);
				const resolved = normalizeColonOption(option, rawValue);

				if (!resolved.success) {
					return resolved;
				}

				normalized.push(...resolved.value);
				continue;
			}
		}

		/*
		 * GNU long syntax.
		 */
		if (token.startsWith("--") && token.length > 2) {
			const body = token.slice(2);
			const equalsIndex = body.indexOf("=");

			const suppliedName =
				equalsIndex === -1 ? body : body.slice(0, equalsIndex);

			const rawValue =
				equalsIndex === -1 ? undefined : body.slice(equalsIndex + 1);

			const negative = suppliedName.startsWith("no-");
			const lookupName = negative ? suppliedName.slice(3) : suppliedName;

			const option = compiled.byLongName.get(lookupName);

			if (option) {
				const resolved = normalizeLongOption(option, rawValue, negative);

				if (!resolved.success) {
					return resolved;
				}

				normalized.push(...resolved.value.tokens);
				nextTokenIsOptionValue = resolved.value.consumesFollowingValue;
				continue;
			}
		}

		/*
		 * Protect the following token for a value-consuming short option.
		 *
		 * Example:
		 *
		 * -a amount:500
		 *
		 * Here amount:500 is the value of -a rather than another named option.
		 */
		if (token.length === 2 && token.startsWith("-") && token !== "--") {
			const shortName = token[1];

			if (shortName !== undefined) {
				const option = compiled.byShortName.get(shortName);

				if (option?.kind === "string") {
					normalized.push(token);
					nextTokenIsOptionValue = true;
					continue;
				}
			}
		}

		/*
		 * `parseArgs` naturally treats leading '-' as option syntax. Preserve
		 * ordinary negative numeric positionals without weakening strict
		 * unknown-option handling.
		 */
		if (NEGATIVE_NUMBER_PATTERN.test(token)) {
			normalized.push(preserveLiteral(token, index));
			continue;
		}

		normalized.push(token);
	}

	return {
		success: true,
		value: {
			tokens: normalized,
			literalTokens,
		},
	};
}

function restoreLiteral(
	value: string,
	literals: ReadonlyMap<string, string>,
): string {
	return literals.get(value) ?? value;
}

function normalizeParsedOptionName(
	name: string,
	compiled: CompiledMessageSyntax,
): string {
	if (compiled.options[name] !== undefined) {
		return name;
	}

	if (name.startsWith("no-")) {
		const baseName = name.slice(3);

		if (compiled.options[baseName]?.type === "boolean") {
			return baseName;
		}
	}

	return name;
}

function formatParseArgsError(error: unknown): string {
	if (error instanceof Error && error.message.length > 0) {
		return error.message;
	}

	return "Could not parse the command arguments.";
}

/**
 * Parses message-command grammar into raw named and positional values.
 *
 * Semantic conversion is intentionally performed later by messageParser.ts.
 */
export function parseMessageSyntax(
	schema: ArgumentSchema,
	tokens: readonly string[],
): ArgumentParseResult<ParsedMessageSyntax> {
	const compiled = compileMessageSyntax(schema);

	const normalized = normalizeMessageSyntax(compiled, tokens);

	if (!normalized.success) {
		return normalized;
	}

	try {
		const parsed = parseArgs({
			args: normalized.value.tokens,
			options: compiled.options,
			strict: true,
			allowPositionals: true,
			allowNegative: true,
			tokens: true,
		});

		const seenOptions = new Set<string>();

		for (const token of parsed.tokens) {
			if (token.kind !== "option") {
				continue;
			}

			const canonicalName = normalizeParsedOptionName(token.name, compiled);

			if (seenOptions.has(canonicalName)) {
				return {
					success: false,
					error: {
						code: "DUPLICATE_OPTION",
						argument: canonicalName,
						message: `Option \`${canonicalName}\` was provided more than once.`,
					},
				};
			}

			seenOptions.add(canonicalName);
		}

		const options: Record<string, string | boolean> = {};

		for (const [name, rawValue] of Object.entries(parsed.values)) {
			if (typeof rawValue === "string" || typeof rawValue === "boolean") {
				options[name] = rawValue;
			}
		}

		return {
			success: true,
			value: {
				positionals: parsed.positionals.map((position) =>
					restoreLiteral(position, normalized.value.literalTokens),
				),
				options,
			},
		};
	} catch (error) {
		return {
			success: false,
			error: {
				code: "INVALID_SYNTAX",
				message: formatParseArgsError(error),
			},
		};
	}
}
