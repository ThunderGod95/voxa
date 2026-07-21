import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { ChatInputCommandInteraction, Message } from "discord.js";
import { argument } from "@/arguments/builder";
import {
    CommandManager,
    createSlashCommandBuilder,
    defineCommand,
} from "@/manager";

describe("CommandManager", () => {
    let manager: CommandManager;

    beforeEach(() => {
        manager = new CommandManager({ prefix: "!" });
    });

    describe("Command Registration", () => {
        test("validates and stores command properties", () => {
            const cmd = defineCommand({
                name: "ping",
                description: "Pong command",
                aliases: ["p"],
                execute: () => {},
            });

            manager.registerCommands([cmd]);

            expect(manager.commands.has("ping")).toBe(true);
            expect(manager.commands.has("p")).toBe(true);
            expect(manager.commands.get("ping")?.description).toBe(
                "Pong command",
            );
        });

        test("throws error on invalid name", () => {
            const cmd = defineCommand({
                name: "Invalid Name!",
                description: "Test",
                execute: () => {},
            });

            expect(() => manager.registerCommands([cmd])).toThrow();
        });

        test("creates slash command builder properties successfully", () => {
            const cmd = defineCommand({
                name: "test",
                description: "test desc",
                guildOnly: true,
                userPermissions: ["Administrator"],
                execute: () => {},
            });

            const builder = createSlashCommandBuilder(cmd);
            expect(builder).toBeDefined();
            expect(builder.name).toBe("test");
        });
    });

    describe("Execution Handling", () => {
        test("executes message commands correctly with string parsing", async () => {
            const executeMock = mock();
            const cmd = defineCommand({
                name: "echo",
                description: "Echoes text",
                arguments: {
                    text: argument.string({
                        description: "Text to echo",
                        rest: true,
                    }),
                },
                execute: executeMock,
            });

            manager.registerCommands([cmd]);

            const msg = {
                content: "!echo hello world",
                author: { id: "123", bot: false },
                channel: { isTextBased: () => true, isDMBased: () => false },
            } as unknown as Message;

            const handled = await manager.handleMessage(msg);

            expect(handled).toBe(true);
            expect(executeMock).toHaveBeenCalled();
            const ctx = executeMock.mock.calls[0]![0];
            expect(ctx.args.text).toBe("hello world");
        });

        test("ignores messages without configured prefix", async () => {
            const msg = {
                content: "?echo hello",
                author: { id: "123", bot: false },
            } as unknown as Message;

            const handled = await manager.handleMessage(msg);
            expect(handled).toBe(false);
        });

        test("restricts execution to devIds if allowOnlyDevs is true", async () => {
            const devManager = new CommandManager({
                prefix: "!",
                allowOnlyDevs: true,
                devIds: ["dev-1"],
            });

            const executeMock = mock();
            devManager.registerCommands([
                {
                    name: "testcmd",
                    description: "test",
                    execute: executeMock,
                    slash: true,
                },
            ]);

            const baseInteraction = {
                isChatInputCommand: () => true,
                commandName: "testcmd",
                deferred: false,
                replied: false,
                reply: mock().mockResolvedValue(true),
                editReply: mock().mockResolvedValue(true),
                fetchReply: mock().mockResolvedValue(true),
            };

            const strangerInteraction = {
                ...baseInteraction,
                user: { id: "stranger", bot: false },
            } as unknown as ChatInputCommandInteraction;

            const handledStranger =
                await devManager.handleInteraction(strangerInteraction);
            expect(handledStranger).toBe(false);

            const devInteraction = {
                ...baseInteraction,
                user: { id: "dev-1", bot: false },
            } as unknown as ChatInputCommandInteraction;

            const handledDev =
                await devManager.handleInteraction(devInteraction);
            expect(handledDev).toBe(true);
        });

        test("fails if parsed arguments return errors", async () => {
            const executeMock = mock();
            const cmd = defineCommand({
                name: "math",
                description: "Math test",
                arguments: {
                    num: argument.integer({
                        description: "Required int",
                        required: true,
                    }),
                },
                execute: executeMock,
            });

            manager.registerCommands([cmd]);

            const msg = {
                content: "!math not-a-number",
                author: { id: "123", bot: false },
                reply: mock().mockResolvedValue(true),
            } as unknown as Message;

            const handled = await manager.handleMessage(msg);

            expect(handled).toBe(false);
            expect(msg.reply).toHaveBeenCalled();
            expect(executeMock).not.toHaveBeenCalled();
        });
    });
});
