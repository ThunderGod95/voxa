import { describe, expect, mock, test } from "bun:test";
import type { Message } from "discord.js";
import { argument } from "@/arguments/builder";
import { parseMessageArguments } from "@/arguments/messageParser";

// Mock the resolver functions since they rely heavily on Discord.js caches
mock.module("@/resolvers", () => ({
    getUserFromInput: mock((input: string) =>
        input === "123" ? { id: "123" } : undefined,
    ),
    getRoleFromInput: mock((input: string) =>
        input === "admin" ? { name: "admin" } : undefined,
    ),
}));

describe("Message Parser", () => {
    const createMockMessage = () =>
        ({
            guild: {
                members: {
                    fetch: mock().mockResolvedValue({ user: { id: "123" } }),
                },
            },
        }) as unknown as Message;

    test("parses sequential tokens into schema definitions", async () => {
        const schema = {
            count: argument.integer({ description: "Amount", required: true }),
            flag: argument.boolean({ description: "Enable feature" }),
        };

        const msg = createMockMessage();
        const tokens = ["42", "true"];

        const result = await parseMessageArguments(schema, msg, tokens);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.value.count).toBe(42);
            expect(result.value.flag).toBe(true);
        }
    });

    test("consumes remaining tokens into a rest argument", async () => {
        const schema = {
            mode: argument.string({ description: "Mode" }),
            reason: argument.string({ description: "Reason", rest: true }),
        };

        const msg = createMockMessage();
        const tokens = ["ban", "spam", "and", "abuse"];

        const result = await parseMessageArguments(schema, msg, tokens);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.value.mode).toBe("ban");
            expect(result.value.reason).toBe("spam and abuse"); // Rest argument joins array[cite: 1]
        }
    });

    test("returns TOO_MANY_ARGUMENTS if tokens exceed schema length without a rest arg", async () => {
        const schema = {
            id: argument.integer({ description: "ID" }),
        };

        const msg = createMockMessage();
        const tokens = ["1", "extra", "token"]; // More tokens than arguments

        const result = await parseMessageArguments(schema, msg, tokens);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.code).toBe("TOO_MANY_ARGUMENTS");
        }
    });
});
