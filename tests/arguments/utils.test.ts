import { describe, expect, spyOn, test } from "bun:test";
import { SlashCommandBuilder } from "discord.js";
import { argument } from "@/arguments/builder";
import {
    addArgumentsToSlashCommand,
    formatArgumentUsage,
    validateArgumentSchema,
} from "@/arguments/utils";

describe("Argument Utils", () => {
    describe("formatArgumentUsage", () => {
        test("formats required and optional arguments correctly", () => {
            const schema = {
                user: argument.user({
                    description: "The user",
                    required: true,
                }),
                reason: argument.string({ description: "The reason" }), // default required: false
                flags: argument.string({
                    description: "Extra flags",
                    rest: true,
                }),
            };

            const usage = formatArgumentUsage(schema);
            expect(usage).toBe("<user> [reason] [flags...]");
        });
    });

    describe("validateArgumentSchema", () => {
        test("passes a valid schema", () => {
            const schema = {
                target: argument.user({
                    description: "Target",
                    required: true,
                }),
                reason: argument.string({
                    description: "Reason",
                    required: false,
                    rest: true,
                }),
            };
            expect(() => validateArgumentSchema("ban", schema)).not.toThrow();
        });

        test("throws if required argument comes after optional", () => {
            const schema = {
                reason: argument.string({
                    description: "Reason",
                    required: false,
                }),
                target: argument.user({
                    description: "Target",
                    required: true,
                }),
            };
            expect(() => validateArgumentSchema("test", schema)).toThrow(
                'Required argument "target" cannot appear after an optional argument in command "test".',
            );
        });

        test("throws if argument comes after a rest argument", () => {
            const schema = {
                message: argument.string({ description: "Msg", rest: true }),
                other: argument.string({ description: "Other" }),
            };
            expect(() => validateArgumentSchema("test", schema)).toThrow(
                'Argument "other" cannot appear after a rest argument in command "test".',
            );
        });

        test("throws on invalid names", () => {
            const schema = {
                "Invalid Name!": argument.string({ description: "test" }),
            };
            expect(() => validateArgumentSchema("test", schema)).toThrow(
                'Command "test" has an invalid argument name: "Invalid Name!".',
            );
        });
    });

    test("appends corresponding options to SlashCommandBuilder based on schema", () => {
        const builder = new SlashCommandBuilder()
            .setName("test")
            .setDescription("test cmd");

        // Spies to verify the correct discord.js builder methods are called
        const stringSpy = spyOn(builder, "addStringOption");
        const integerSpy = spyOn(builder, "addIntegerOption");
        const userSpy = spyOn(builder, "addUserOption");

        const schema = {
            title: argument.string({
                description: "The title",
                required: true,
                maxLength: 100,
            }),
            age: argument.integer({ description: "The age", min: 18 }),
            target: argument.user({ description: "The target" }),
        };

        addArgumentsToSlashCommand(builder, schema);

        expect(stringSpy).toHaveBeenCalled();
        expect(integerSpy).toHaveBeenCalled();
        expect(userSpy).toHaveBeenCalled();

        // The builder should now contain 3 configured options
        expect(builder.options.length).toBe(3);

        const json = builder.toJSON();

        // Assert string option properties
        const stringOpt = json.options?.find((o) => o.name === "title") as any;
        expect(stringOpt).toBeDefined();
        expect(stringOpt.description).toBe("The title");
        expect(stringOpt.required).toBe(true);
        expect(stringOpt.max_length).toBe(100);

        // Assert integer option properties
        const intOpt = json.options?.find((o) => o.name === "age") as any;
        expect(intOpt).toBeDefined();
        expect(intOpt.min_value).toBe(18);
    });
});
