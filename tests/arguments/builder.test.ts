import { describe, expect, test } from "bun:test";
import { argument } from "@/arguments/builder";

describe("Argument Builder", () => {
    describe("String Argument", () => {
        test("validates min and max lengths", async () => {
            const arg = argument.string({
                description: "test",
                minLength: 3,
                maxLength: 5,
            });

            expect((await arg._schema.safeParseAsync("hi")).success).toBe(
                false,
            );
            expect((await arg._schema.safeParseAsync("hello")).success).toBe(
                true,
            );
            expect((await arg._schema.safeParseAsync("too long")).success).toBe(
                false,
            );
        });
    });

    describe("Integer Argument", () => {
        test("coerces numeric strings to integers", async () => {
            const arg = argument.integer({ description: "test" });
            const result = await arg._schema.safeParseAsync("123");

            expect(result.success).toBe(true);
            if (result.success) expect(result.data).toBe(123);
        });

        test("fails on floating point strings", async () => {
            const arg = argument.integer({ description: "test" });
            const result = await arg._schema.safeParseAsync("123.45");
            expect(result.success).toBe(false);
        });
    });

    describe("Number Argument", () => {
        test("coerces valid floating point strings and validates bounds", async () => {
            const arg = argument.number({
                description: "test",
                min: 1.5,
                max: 5.5,
            });

            expect((await arg._schema.safeParseAsync("3.14")).success).toBe(
                true,
            ); // Coerced
            expect((await arg._schema.safeParseAsync(2.5)).success).toBe(true);
            expect((await arg._schema.safeParseAsync("1.0")).success).toBe(
                false,
            ); // Below min
            expect((await arg._schema.safeParseAsync("6.0")).success).toBe(
                false,
            ); // Above max
        });
    });

    describe("Boolean Argument", () => {
        test("coerces truthy and falsy string values", async () => {
            const arg = argument.boolean({ description: "test" });

            const trueCases = ["true", "yes", "y", "1", "on", "enable"];
            for (const val of trueCases) {
                const res = await arg._schema.safeParseAsync(val);
                expect(res.success && res.data === true).toBe(true);
            }

            const falseCases = ["false", "no", "n", "0", "off", "disable"];
            for (const val of falseCases) {
                const res = await arg._schema.safeParseAsync(val);
                expect(res.success && res.data === false).toBe(true);
            }
        });
    });

    describe("URL Argument", () => {
        test("validates properly formatted URLs", async () => {
            const arg = argument.url({ description: "test" });

            expect(
                (await arg._schema.safeParseAsync("https://example.com"))
                    .success,
            ).toBe(true);
            expect(
                (await arg._schema.safeParseAsync("not-a-url")).success,
            ).toBe(false);
        });
    });

    describe("Optional vs Required", () => {
        test("allows null when required is false", async () => {
            const arg = argument.string({
                description: "test",
                required: false,
            });
            const result = await arg._schema.safeParseAsync(null);
            expect(result.success).toBe(true);
        });

        test("rejects null when required is true", async () => {
            const arg = argument.string({
                description: "test",
                required: true,
            });
            const result = await arg._schema.safeParseAsync(null);
            expect(result.success).toBe(false);
        });
    });
});
