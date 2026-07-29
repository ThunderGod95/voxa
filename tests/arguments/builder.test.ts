import { describe, expect, test } from "bun:test";
import { argument, option, value } from "../../src/arguments";

describe("argument builder", () => {
	test("creates a constrained string argument", async () => {
		const arg = argument.string({
			description: "A string.",
			minLength: 3,
			maxLength: 5,
		});

		expect((await arg.value._schema.safeParseAsync("hi")).success).toBe(false);

		expect((await arg.value._schema.safeParseAsync("hello")).success).toBe(
			true,
		);

		expect((await arg.value._schema.safeParseAsync("too long")).success).toBe(
			false,
		);

		expect(arg.placement).toBe("positional");
		expect(arg.required).toBe(false);
	});

	test("coerces integer strings", async () => {
		const arg = argument.integer({
			description: "An integer.",
		});

		const result = await arg.value._schema.safeParseAsync("123");

		expect(result).toEqual({
			success: true,
			data: 123,
		});
	});

	test("rejects decimal input for integers", async () => {
		const arg = argument.integer({
			description: "An integer.",
		});

		const result = await arg.value._schema.safeParseAsync("123.45");

		expect(result.success).toBe(false);
	});

	test("coerces and constrains number values", async () => {
		const arg = argument.number({
			description: "A number.",
			min: 2,
			max: 5,
		});

		expect((await arg.value._schema.safeParseAsync("3.14")).success).toBe(true);

		expect((await arg.value._schema.safeParseAsync(2.5)).success).toBe(true);

		expect((await arg.value._schema.safeParseAsync("1.0")).success).toBe(false);

		expect((await arg.value._schema.safeParseAsync("6.0")).success).toBe(false);
	});

	test("parses supported true boolean values", async () => {
		const arg = argument.boolean({
			description: "A boolean.",
		});

		for (const input of ["true", "yes", "y", "1", "on", "enable", "enabled"]) {
			const result = await arg.value._schema.safeParseAsync(input);

			expect(result).toEqual({
				success: true,
				data: true,
			});
		}
	});

	test("parses supported false boolean values", async () => {
		const arg = argument.boolean({
			description: "A boolean.",
		});

		for (const input of [
			"false",
			"no",
			"n",
			"0",
			"off",
			"disable",
			"disabled",
		]) {
			const result = await arg.value._schema.safeParseAsync(input);

			expect(result).toEqual({
				success: true,
				data: false,
			});
		}
	});

	test("parses valid URLs", async () => {
		const arg = argument.url({
			description: "A URL.",
		});

		const result = await arg.value._schema.safeParseAsync(
			"https://example.com",
		);

		expect(result.success).toBe(true);

		if (!result.success) {
			throw new Error("Expected URL parsing to succeed.");
		}

		expect(result.data).toBeInstanceOf(URL);
		expect(result.data.href).toBe("https://example.com/");
	});

	test("rejects invalid URLs", async () => {
		const arg = argument.url({
			description: "A URL.",
		});

		expect((await arg.value._schema.safeParseAsync("not-a-url")).success).toBe(
			false,
		);
	});

	test("optional arguments are optional at the binding layer", async () => {
		const arg = argument.string({
			description: "Optional string.",
		});

		expect(arg.required).toBe(false);

		/*
		 * The semantic value itself remains non-nullable.
		 *
		 * parseMessageArguments() produces null when this binding is omitted.
		 */
		const result = await arg.value._schema.safeParseAsync(null);

		expect(result.success).toBe(false);
	});

	test("required arguments are required at the binding layer", async () => {
		const arg = argument.string({
			description: "Required string.",
			required: true,
		});

		expect(arg.required).toBe(true);

		const result = await arg.value._schema.safeParseAsync(null);

		expect(result.success).toBe(false);
	});

	test("creates rest positional arguments", () => {
		const arg = argument.string({
			description: "Remaining text.",
			rest: true,
		});

		expect(arg.placement).toBe("positional");
		expect(arg.rest).toBe(true);
	});

	test("creates named options", () => {
		const amount = option.integer({
			description: "Amount.",
			required: true,
			short: "a",
			longAliases: ["xp"],
		});

		expect(amount.placement).toBe("option");
		expect(amount.required).toBe(true);
		expect(amount.short).toBe("a");
		expect(amount.longAliases).toEqual(["xp"]);
	});

	test("preserves literal string choices", async () => {
		const arg = argument.string({
			description: "Metric.",
			choices: ["xp", "messages", "reactions"] as const,
		});

		expect((await arg.value._schema.safeParseAsync("xp")).success).toBe(true);

		expect((await arg.value._schema.safeParseAsync("invalid")).success).toBe(
			false,
		);
	});

	test("preserves numeric choices", async () => {
		const arg = option.integer({
			description: "Page size.",
			choices: [10, 25, 50] as const,
		});

		expect((await arg.value._schema.safeParseAsync(25)).success).toBe(true);

		expect((await arg.value._schema.safeParseAsync(30)).success).toBe(false);
	});

	test("constructs reusable semantic values", async () => {
		const integer = value.integer({
			min: 1,
			max: 10,
		});

		expect((await integer._schema.safeParseAsync("5")).success).toBe(true);

		expect((await integer._schema.safeParseAsync("20")).success).toBe(false);
	});

	test("constructs unions", () => {
		const arg = argument.union({
			description: "Integer or text.",
			variants: [value.integer(), value.string()],
			slashVariant: 0,
		});

		expect(arg.value.type).toBe("union");
		expect(arg.value.variants).toHaveLength(2);
		expect(arg.value.slashVariant).toBe(0);
	});
});
