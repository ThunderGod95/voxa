import { describe, expect, test } from "bun:test";
import {
	argument,
	option,
	parseMessageSyntax,
	tokenizeArguments,
} from "../../src/arguments";

const schema = {
	target: argument.string({
		description: "Target.",
		required: true,
	}),

	amount: option.integer({
		description: "Amount.",
		required: true,
		short: "a",
		longAliases: ["xp"],
	}),

	reason: option.string({
		description: "Reason.",
		short: "r",
	}),

	silent: option.boolean({
		description: "Silent.",
		short: "s",
	}),
} as const;

function parse(input: string) {
	const tokenized = tokenizeArguments(input);

	if (!tokenized.success) {
		throw new Error(tokenized.error.message);
	}

	return parseMessageSyntax(schema, tokenized.tokens);
}

describe("parseMessageSyntax", () => {
	test("parses canonical name:value options", () => {
		const result = parse(
			'@tarun amount:500 reason:"Manual correction" silent:true',
		);

		expect(result).toEqual({
			success: true,
			value: {
				positionals: ["@tarun"],
				options: {
					amount: "500",
					reason: "Manual correction",
					silent: true,
				},
			},
		});
	});

	test("allows named options before positionals", () => {
		const result = parse(
			'amount:500 silent:true @tarun reason:"Manual correction"',
		);

		expect(result).toEqual({
			success: true,
			value: {
				positionals: ["@tarun"],
				options: {
					amount: "500",
					silent: true,
					reason: "Manual correction",
				},
			},
		});
	});

	test("parses GNU long options", () => {
		const result = parse(
			'@tarun --amount 500 --reason "Manual correction" --silent',
		);

		expect(result).toEqual({
			success: true,
			value: {
				positionals: ["@tarun"],
				options: {
					amount: "500",
					reason: "Manual correction",
					silent: true,
				},
			},
		});
	});

	test("parses GNU inline values", () => {
		const result = parse("@tarun --amount=500 --reason=test");

		expect(result).toEqual({
			success: true,
			value: {
				positionals: ["@tarun"],
				options: {
					amount: "500",
					reason: "test",
				},
			},
		});
	});

	test("parses short options", () => {
		const result = parse('@tarun -a 500 -r "Manual correction" -s');

		expect(result).toEqual({
			success: true,
			value: {
				positionals: ["@tarun"],
				options: {
					amount: "500",
					reason: "Manual correction",
					silent: true,
				},
			},
		});
	});

	test("parses long aliases", () => {
		const canonical = parse("@tarun xp:500");
		const gnu = parse("@tarun --xp 500");

		expect(canonical).toEqual({
			success: true,
			value: {
				positionals: ["@tarun"],
				options: {
					amount: "500",
				},
			},
		});

		expect(gnu).toEqual({
			success: true,
			value: {
				positionals: ["@tarun"],
				options: {
					amount: "500",
				},
			},
		});
	});

	test("supports false boolean values", () => {
		const canonical = parse("@tarun amount:500 silent:false");

		const gnu = parse("@tarun --amount 500 --no-silent");

		expect(canonical).toEqual({
			success: true,
			value: {
				positionals: ["@tarun"],
				options: {
					amount: "500",
					silent: false,
				},
			},
		});

		expect(gnu).toEqual({
			success: true,
			value: {
				positionals: ["@tarun"],
				options: {
					amount: "500",
					silent: false,
				},
			},
		});
	});

	test("supports GNU boolean inline values", () => {
		const result = parse("@tarun --amount 500 --silent=false");

		expect(result).toEqual({
			success: true,
			value: {
				positionals: ["@tarun"],
				options: {
					amount: "500",
					silent: false,
				},
			},
		});
	});

	test("does not treat undeclared colon syntax as an option", () => {
		const result = parse("https://example.com amount:500");

		expect(result).toEqual({
			success: true,
			value: {
				positionals: ["https://example.com"],
				options: {
					amount: "500",
				},
			},
		});
	});

	test("allows colons inside option values", () => {
		const result = parse(
			'@tarun amount:500 reason:"https://example.com:8080/foo"',
		);

		expect(result).toEqual({
			success: true,
			value: {
				positionals: ["@tarun"],
				options: {
					amount: "500",
					reason: "https://example.com:8080/foo",
				},
			},
		});
	});

	test("does not reinterpret a GNU option value", () => {
		const result = parse("@tarun --reason amount:500 --amount 100");

		expect(result).toEqual({
			success: true,
			value: {
				positionals: ["@tarun"],
				options: {
					reason: "amount:500",
					amount: "100",
				},
			},
		});
	});

	test("supports negative positional numbers", () => {
		const numericSchema = {
			value: argument.integer({
				description: "Value.",
				required: true,
			}),
		} as const;

		const result = parseMessageSyntax(numericSchema, ["-500"]);

		expect(result).toEqual({
			success: true,
			value: {
				positionals: ["-500"],
				options: {},
			},
		});
	});

	test("supports negative canonical option numbers", () => {
		const result = parse("@tarun amount:-500");

		expect(result).toEqual({
			success: true,
			value: {
				positionals: ["@tarun"],
				options: {
					amount: "-500",
				},
			},
		});
	});

	test("rejects duplicate options", () => {
		const result = parse("@tarun amount:500 --amount 600");

		expect(result.success).toBe(false);

		if (result.success) {
			throw new Error("Expected parsing to fail.");
		}

		expect(result.error.code).toBe("DUPLICATE_OPTION");
		expect(result.error.argument).toBe("amount");
	});

	test("rejects invalid boolean values", () => {
		const result = parse("@tarun amount:500 silent:maybe");

		expect(result.success).toBe(false);

		if (result.success) {
			throw new Error("Expected parsing to fail.");
		}

		expect(result.error.code).toBe("INVALID_ARGUMENT");
		expect(result.error.argument).toBe("silent");
	});

	test("rejects unknown GNU options", () => {
		const result = parse("@tarun amount:500 --whatever nope");

		expect(result.success).toBe(false);
	});

	test("respects the option terminator", () => {
		const result = parse("amount:500 -- silent:true hello");

		expect(result).toEqual({
			success: true,
			value: {
				positionals: ["silent:true", "hello"],
				options: {
					amount: "500",
				},
			},
		});
	});
});
