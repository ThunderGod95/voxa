import type {
    SlashCommandBuilder,
    SlashCommandSubcommandBuilder,
} from "discord.js";
import {
    formatArgumentChoiceValues,
    getArgumentChoiceValues,
    resolveArgumentChoices,
} from "./choices";

import type {
    ArgumentChoices,
    ArgumentChoiceValue,
    ArgumentSchema,
    CommandArgumentDefinition,
    StringArgumentDefinition,
} from "./types";

/**
 * Mutates a SlashCommandBuilder by automatically appending options derived from an ArgumentSchema.
 *
 * @param builder - The Discord.js SlashCommandBuilder instance.
 * @param schema - The schema defining the command's arguments.
 */
export function addArgumentsToSlashCommand(
    builder: SlashCommandBuilder | SlashCommandSubcommandBuilder,
    schema: ArgumentSchema,
): void {
    for (const [name, definition] of Object.entries(schema)) {
        switch (definition.type) {
            case "string":
                builder.addStringOption((option) => {
                    option
                        .setName(name)
                        .setDescription(definition.description)
                        .setRequired(definition.required);

                    if (definition.minLength !== undefined) {
                        option.setMinLength(definition.minLength);
                    }

                    if (definition.maxLength !== undefined) {
                        option.setMaxLength(definition.maxLength);
                    }

                    if (definition.choices !== undefined) {
                        option.addChoices(
                            ...resolveArgumentChoices(definition.choices),
                        );
                    } else if (definition.autocomplete !== undefined) {
                        option.setAutocomplete(true);
                    }

                    return option;
                });
                break;

            case "timezone":
            case "time":
            case "url":
                builder.addStringOption((option) => {
                    option
                        .setName(name)
                        .setDescription(definition.description)
                        .setRequired(definition.required);

                    if (definition.autocomplete !== undefined) {
                        option.setAutocomplete(true);
                    }

                    return option;
                });
                break;

            case "integer":
                builder.addIntegerOption((option) => {
                    option
                        .setName(name)
                        .setDescription(definition.description)
                        .setRequired(definition.required);

                    if (definition.min !== undefined) {
                        option.setMinValue(definition.min);
                    }

                    if (definition.max !== undefined) {
                        option.setMaxValue(definition.max);
                    }

                    if (definition.choices !== undefined) {
                        option.addChoices(
                            ...resolveArgumentChoices(definition.choices),
                        );
                    } else if (definition.autocomplete !== undefined) {
                        option.setAutocomplete(true);
                    }

                    return option;
                });
                break;

            case "number":
                builder.addNumberOption((option) => {
                    option
                        .setName(name)
                        .setDescription(definition.description)
                        .setRequired(definition.required);

                    if (definition.min !== undefined) {
                        option.setMinValue(definition.min);
                    }

                    if (definition.max !== undefined) {
                        option.setMaxValue(definition.max);
                    }

                    if (definition.choices !== undefined) {
                        option.addChoices(
                            ...resolveArgumentChoices(definition.choices),
                        );
                    } else if (definition.autocomplete !== undefined) {
                        option.setAutocomplete(true);
                    }

                    return option;
                });
                break;

            case "boolean":
                builder.addBooleanOption((option) =>
                    option
                        .setName(name)
                        .setDescription(definition.description)
                        .setRequired(definition.required),
                );
                break;

            case "user":
            case "member":
                builder.addUserOption((option) =>
                    option
                        .setName(name)
                        .setDescription(definition.description)
                        .setRequired(definition.required),
                );
                break;

            case "role":
                builder.addRoleOption((option) =>
                    option
                        .setName(name)
                        .setDescription(definition.description)
                        .setRequired(definition.required),
                );
                break;
        }
    }
}

type ChoiceArgumentDefinition = Extract<
    CommandArgumentDefinition,
    { type: "string" | "integer" | "number" }
>;

function validateArgumentChoices(
    commandName: string,
    argumentName: string,
    definition: ChoiceArgumentDefinition,
): void {
    if (
        definition.choices !== undefined &&
        definition.autocomplete !== undefined
    ) {
        throw new Error(
            `Argument "${argumentName}" in command "${commandName}" ` +
                "cannot define both choices and autocomplete.",
        );
    }

    if (definition.choices === undefined) {
        return;
    }

    const choices = resolveArgumentChoices(
        definition.choices as ArgumentChoices<ArgumentChoiceValue>,
    );

    if (choices.length === 0) {
        throw new Error(
            `Argument "${argumentName}" in command "${commandName}" ` +
                "must define at least one choice.",
        );
    }

    if (choices.length > 25) {
        throw new Error(
            `Argument "${argumentName}" in command "${commandName}" ` +
                "cannot define more than 25 choices.",
        );
    }

    for (const choice of choices) {
        if (choice.name.length < 1 || choice.name.length > 100) {
            throw new Error(
                `Choice "${choice.name}" for argument "${argumentName}" ` +
                    `in command "${commandName}" must have a name between ` +
                    "1 and 100 characters.",
            );
        }

        if (
            definition.type === "string" &&
            typeof choice.value === "string" &&
            choice.value.length > 100
        ) {
            throw new Error(
                `Choice "${choice.name}" for argument "${argumentName}" ` +
                    `in command "${commandName}" has a value longer than ` +
                    "100 characters.",
            );
        }

        if (
            definition.type === "integer" &&
            !Number.isSafeInteger(choice.value)
        ) {
            throw new Error(
                `Choice "${choice.name}" for argument "${argumentName}" ` +
                    `in command "${commandName}" must be a safe integer.`,
            );
        }

        if (definition.type === "number" && !Number.isFinite(choice.value)) {
            throw new Error(
                `Choice "${choice.name}" for argument "${argumentName}" ` +
                    `in command "${commandName}" must be finite.`,
            );
        }

        const validation = definition._schema.safeParse(choice.value);

        if (!validation.success) {
            throw new Error(
                `Choice "${choice.name}" for argument "${argumentName}" ` +
                    `in command "${commandName}" is invalid: ` +
                    `${validation.error.issues[0]?.message ?? "Invalid value."}`,
            );
        }
    }
}

function validateStringAliases(
    commandName: string,
    argumentName: string,
    definition: StringArgumentDefinition<boolean, string>,
): void {
    if (definition.aliases === undefined) {
        return;
    }

    if (definition.choices === undefined) {
        throw new Error(
            `Argument "${argumentName}" in command "${commandName}" ` +
                "cannot define aliases without choices.",
        );
    }

    const allowedValues = new Set(getArgumentChoiceValues(definition.choices));

    for (const [alias, value] of Object.entries(definition.aliases)) {
        if (alias.length < 1 || alias.length > 100) {
            throw new Error(
                `Alias "${alias}" for argument "${argumentName}" ` +
                    `in command "${commandName}" must contain between ` +
                    "1 and 100 characters.",
            );
        }

        if (!allowedValues.has(value)) {
            throw new Error(
                `Alias "${alias}" for argument "${argumentName}" ` +
                    `in command "${commandName}" points to invalid value ` +
                    `"${value}".`,
            );
        }

        const validation = definition._schema.safeParse(value);

        if (!validation.success) {
            throw new Error(
                `Alias "${alias}" for argument "${argumentName}" ` +
                    `in command "${commandName}" is invalid: ` +
                    `${validation.error.issues[0]?.message ?? "Invalid value."}`,
            );
        }
    }
}

/**
 * Asserts the validity of an ArgumentSchema at boot-time.
 * Throws an Error if logical constraints (e.g., ordering, limits) are violated.
 *
 * @param commandName - The name of the command (used for error tracing).
 * @param schema - The schema to validate.
 */
export function validateArgumentSchema(
    commandName: string,
    schema: ArgumentSchema,
): void {
    const entries = Object.entries(schema);
    let foundOptional = false;
    let foundRest = false;

    if (entries.length > 25) {
        throw new Error(
            `Command "${commandName}" cannot have more than 25 arguments.`,
        );
    }

    for (const [name, definition] of entries) {
        if (!/^[a-z0-9_-]{1,32}$/u.test(name)) {
            throw new Error(
                `Command "${commandName}" has an invalid argument name: "${name}".`,
            );
        }

        if (
            definition.description.length < 1 ||
            definition.description.length > 100
        ) {
            throw new Error(
                `Argument "${name}" in command "${commandName}" must have a description between 1 and 100 characters.`,
            );
        }

        if (foundRest) {
            throw new Error(
                `Argument "${name}" cannot appear after a rest argument in command "${commandName}".`,
            );
        }

        if (definition.rest) {
            foundRest = true;
        }

        if (definition.required) {
            if (foundOptional) {
                throw new Error(
                    `Required argument "${name}" cannot appear after an optional argument in command "${commandName}".`,
                );
            }
        } else {
            foundOptional = true;
        }

        if (
            definition.type === "string" &&
            definition.minLength !== undefined &&
            definition.maxLength !== undefined &&
            definition.minLength > definition.maxLength
        ) {
            throw new Error(
                `Argument "${name}" in command "${commandName}" has minLength greater than maxLength.`,
            );
        }

        if (
            (definition.type === "integer" || definition.type === "number") &&
            definition.min !== undefined &&
            definition.max !== undefined &&
            definition.min > definition.max
        ) {
            throw new Error(
                `Argument "${name}" in command "${commandName}" has min greater than max.`,
            );
        }

        if (
            definition.type === "string" ||
            definition.type === "integer" ||
            definition.type === "number"
        ) {
            validateArgumentChoices(commandName, name, definition);
        }

        if (definition.type === "string") {
            validateStringAliases(commandName, name, definition);
        }
    }
}

/**
 * Generates a human-readable usage string from an ArgumentSchema.
 * Example format: `<required_arg> [optional_arg] [rest_arg...]`
 *
 * @param schema - The schema to format.
 * @returns Formatted usage string.
 */
export function formatArgumentUsage(schema: ArgumentSchema): string {
    return Object.entries(schema)
        .map(([name, definition]) => {
            const label = definition.rest ? `${name}...` : name;
            return definition.required ? `<${label}>` : `[${label}]`;
        })
        .join(" ");
}
