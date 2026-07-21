import { describe, expect, mock, test } from "bun:test";
import type { ChatInputCommandInteraction } from "discord.js";
import { argument } from "@/arguments/builder";
import { parseInteractionArguments } from "@/arguments/interactionParser";

describe("Interaction Parser", () => {
    const createMockInteraction = (options: Record<string, unknown>) => {
        return {
            options: {
                getString: (name: string) => options[name] ?? null,
                getInteger: (name: string) => options[name] ?? null,
                getNumber: (name: string) => options[name] ?? null,
                getBoolean: (name: string) => options[name] ?? null,
                getUser: (name: string) => options[name] ?? null,
                getRole: (name: string) => options[name] ?? null,
            },
            guild: {
                members: {
                    fetch: mock().mockResolvedValue({ user: { id: "1" } }),
                },
                roles: {
                    fetch: mock().mockResolvedValue({
                        name: "Admin",
                        id: "role-1",
                    }),
                },
            },
        } as unknown as ChatInputCommandInteraction;
    };

    test("successfully parses valid string and integer options", async () => {
        const schema = {
            query: argument.string({
                description: "Search query",
                required: true,
            }),
            limit: argument.integer({ description: "Result limit" }),
        };

        const interaction = createMockInteraction({ query: "hello", limit: 5 });
        const result = await parseInteractionArguments(schema, interaction);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.value.query).toBe("hello");
            expect(result.value.limit).toBe(5);
        }
    });

    test("returns MISSING_ARGUMENT if a required option is absent", async () => {
        const schema = {
            query: argument.string({
                description: "Search query",
                required: true,
            }),
        };

        const interaction = createMockInteraction({}); // Query is null[cite: 1]
        const result = await parseInteractionArguments(schema, interaction);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.code).toBe("MISSING_ARGUMENT");
            expect(result.error.argument).toBe("query");
        }
    });

    test("validates schema constraints during interaction parsing", async () => {
        const schema = {
            limit: argument.integer({ description: "Result limit", min: 10 }),
        };

        const interaction = createMockInteraction({ limit: 5 });
        const result = await parseInteractionArguments(schema, interaction);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.code).toBe("INVALID_ARGUMENT");
        }
    });
});
