import { describe, expect, test } from "bun:test";
import { tokenizeArguments } from "@/arguments/tokenizer";

describe("Tokenizer", () => {
    test("splits simple space-separated arguments", () => {
        const result = tokenizeArguments("hello world 123");
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.tokens).toEqual(["hello", "world", "123"]);
        }
    });

    test("preserves spaces inside double quotes", () => {
        const result = tokenizeArguments('hello "world space" 123');
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.tokens).toEqual(["hello", "world space", "123"]);
        }
    });

    test("preserves spaces inside single quotes", () => {
        const result = tokenizeArguments("hello 'world space' 123");
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.tokens).toEqual(["hello", "world space", "123"]);
        }
    });

    test("handles escaped quotes", () => {
        const result = tokenizeArguments('hello \\"world\\"');
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.tokens).toEqual(["hello", '"world"']);
        }
    });

    test("fails on unterminated double quotes", () => {
        const result = tokenizeArguments('hello "world');
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.code).toBe("INVALID_SYNTAX");
        }
    });

    test("fails on unterminated single quotes", () => {
        const result = tokenizeArguments("hello 'world");
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.code).toBe("INVALID_SYNTAX");
        }
    });
});
