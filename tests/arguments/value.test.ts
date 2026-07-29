import { describe, expect, test } from "bun:test";
import { value } from "../../src/arguments";

describe("argument values", () => {
	test("integer coerces strings", async () => {
		const definition = value.integer();

		const result = await definition._schema.safeParseAsync("500");

		expect(result).toEqual({
			success: true,
			data: 500,
		});
	});

	test("integer rejects decimals", async () => {
		const definition = value.integer();

		const result = await definition._schema.safeParseAsync("1.5");

		expect(result.success).toBe(false);
	});

	test("number accepts decimals", async () => {
		const definition = value.number();

		const result = await definition._schema.safeParseAsync("1.5");

		expect(result).toEqual({
			success: true,
			data: 1.5,
		});
	});

	test("boolean accepts friendly true values", async () => {
		const definition = value.boolean();

		for (const input of ["true", "yes", "1", "on", "enabled"]) {
			const result = await definition._schema.safeParseAsync(input);

			expect(result).toEqual({
				success: true,
				data: true,
			});
		}
	});

	test("boolean accepts friendly false values", async () => {
		const definition = value.boolean();

		for (const input of ["false", "no", "0", "off", "disabled"]) {
			const result = await definition._schema.safeParseAsync(input);

			expect(result).toEqual({
				success: true,
				data: false,
			});
		}
	});

	test("string choices preserve literal values", async () => {
		const definition = value.string({
			choices: ["xp", "messages", "reactions"] as const,
		});

		expect(await definition._schema.safeParseAsync("xp")).toEqual({
			success: true,
			data: "xp",
		});

		expect((await definition._schema.safeParseAsync("invalid")).success).toBe(
			false,
		);
	});

	test("union preserves variant declarations", () => {
		const definition = value.union([value.integer(), value.string()], {
			slashVariant: 0,
		});

		expect(definition.type).toBe("union");
		expect(definition.variants).toHaveLength(2);
		expect(definition.slashVariant).toBe(0);
	});
});
