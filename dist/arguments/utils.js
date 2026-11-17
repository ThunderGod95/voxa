import { getArgumentChoiceValues, resolveArgumentChoices } from "./choices";
import { describeValueDefinition, getSlashValueDefinition, isAutocompletableValueDefinition, isMessageFlagValueDefinition, } from "./value";
const ARGUMENT_NAME_PATTERN = /^[a-z0-9_-]{1,32}$/u;
function hasChoices(definition) {
    return (definition.type === "string" ||
        definition.type === "integer" ||
        definition.type === "number");
}
/**
 * Appends one schema entry to a Discord slash-command builder.
 */
function addSlashArgument(builder, name, schemaDefinition) {
    const definition = getSlashValueDefinition(schemaDefinition.value);
    switch (definition.type) {
        case "string":
            builder.addStringOption((option) => {
                option
                    .setName(name)
                    .setDescription(schemaDefinition.description)
                    .setRequired(schemaDefinition.required);
                if (definition.minLength !== undefined) {
                    option.setMinLength(definition.minLength);
                }
                if (definition.maxLength !== undefined) {
                    option.setMaxLength(definition.maxLength);
                }
                if (definition.choices !== undefined) {
                    option.addChoices(...resolveArgumentChoices(definition.choices));
                }
                else if (schemaDefinition.autocomplete !== undefined) {
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
                    .setDescription(schemaDefinition.description)
                    .setRequired(schemaDefinition.required);
                if (schemaDefinition.autocomplete !== undefined) {
                    option.setAutocomplete(true);
                }
                return option;
            });
            break;
        case "integer":
            builder.addIntegerOption((option) => {
                option
                    .setName(name)
                    .setDescription(schemaDefinition.description)
                    .setRequired(schemaDefinition.required);
                if (definition.min !== undefined) {
                    option.setMinValue(definition.min);
                }
                if (definition.max !== undefined) {
                    option.setMaxValue(definition.max);
                }
                if (definition.choices !== undefined) {
                    option.addChoices(...resolveArgumentChoices(definition.choices));
                }
                else if (schemaDefinition.autocomplete !== undefined) {
                    option.setAutocomplete(true);
                }
                return option;
            });
            break;
        case "number":
            builder.addNumberOption((option) => {
                option
                    .setName(name)
                    .setDescription(schemaDefinition.description)
                    .setRequired(schemaDefinition.required);
                if (definition.min !== undefined) {
                    option.setMinValue(definition.min);
                }
                if (definition.max !== undefined) {
                    option.setMaxValue(definition.max);
                }
                if (definition.choices !== undefined) {
                    option.addChoices(...resolveArgumentChoices(definition.choices));
                }
                else if (schemaDefinition.autocomplete !== undefined) {
                    option.setAutocomplete(true);
                }
                return option;
            });
            break;
        case "boolean":
            builder.addBooleanOption((option) => option
                .setName(name)
                .setDescription(schemaDefinition.description)
                .setRequired(schemaDefinition.required));
            break;
        case "user":
        case "member":
            builder.addUserOption((option) => option
                .setName(name)
                .setDescription(schemaDefinition.description)
                .setRequired(schemaDefinition.required));
            break;
        case "role":
            builder.addRoleOption((option) => option
                .setName(name)
                .setDescription(schemaDefinition.description)
                .setRequired(schemaDefinition.required));
            break;
    }
}
/**
 * Mutates a slash-command builder by appending arguments derived from a Voxa
 * schema.
 *
 * Required options are emitted before optional ones because Discord requires
 * that ordering. Message-command schema order is preserved independently.
 */
export function addArgumentsToSlashCommand(builder, schema) {
    const entries = Object.entries(schema).sort(([, left], [, right]) => Number(right.required) - Number(left.required));
    for (const [name, definition] of entries) {
        addSlashArgument(builder, name, definition);
    }
}
function validateChoices(commandName, argumentName, definition) {
    if (definition.choices === undefined) {
        return;
    }
    const choices = resolveArgumentChoices(definition.choices);
    if (choices.length === 0) {
        throw new Error(`Argument "${argumentName}" in command "${commandName}" ` +
            "must define at least one choice.");
    }
    if (choices.length > 25) {
        throw new Error(`Argument "${argumentName}" in command "${commandName}" ` +
            "cannot define more than 25 choices.");
    }
    for (const choice of choices) {
        if (choice.name.length < 1 || choice.name.length > 100) {
            throw new Error(`Choice "${choice.name}" for argument ` +
                `"${argumentName}" in command "${commandName}" ` +
                "must have a name between 1 and 100 characters.");
        }
        if (definition.type === "string" &&
            typeof choice.value === "string" &&
            choice.value.length > 100) {
            throw new Error(`Choice "${choice.name}" for argument ` +
                `"${argumentName}" in command "${commandName}" ` +
                "has a value longer than 100 characters.");
        }
        if (definition.type === "integer" && !Number.isSafeInteger(choice.value)) {
            throw new Error(`Choice "${choice.name}" for argument ` +
                `"${argumentName}" in command "${commandName}" ` +
                "must be a safe integer.");
        }
        if (definition.type === "number" &&
            (typeof choice.value !== "number" || !Number.isFinite(choice.value))) {
            throw new Error(`Choice "${choice.name}" for argument ` +
                `"${argumentName}" in command "${commandName}" ` +
                "must be finite.");
        }
        const validation = definition._schema.safeParse(choice.value);
        if (!validation.success) {
            throw new Error(`Choice "${choice.name}" for argument ` +
                `"${argumentName}" in command "${commandName}" ` +
                `is invalid: ` +
                (validation.error.issues[0]?.message ?? "Invalid value."));
        }
    }
}
function validateStringChoiceAliases(commandName, argumentName, definition) {
    if (definition.aliases === undefined) {
        return;
    }
    if (definition.choices === undefined) {
        throw new Error(`Argument "${argumentName}" in command "${commandName}" ` +
            "cannot define choice aliases without choices.");
    }
    const allowedValues = new Set(getArgumentChoiceValues(definition.choices));
    for (const [alias, value] of Object.entries(definition.aliases)) {
        if (alias.length < 1 || alias.length > 100) {
            throw new Error(`Choice alias "${alias}" for argument ` +
                `"${argumentName}" in command "${commandName}" ` +
                "must contain between 1 and 100 characters.");
        }
        if (!allowedValues.has(value)) {
            throw new Error(`Choice alias "${alias}" for argument ` +
                `"${argumentName}" in command "${commandName}" ` +
                `points to invalid value "${value}".`);
        }
        const validation = definition._schema.safeParse(value);
        if (!validation.success) {
            throw new Error(`Choice alias "${alias}" for argument ` +
                `"${argumentName}" in command "${commandName}" ` +
                `is invalid: ` +
                (validation.error.issues[0]?.message ?? "Invalid value."));
        }
    }
}
function validateScalarValue(commandName, argumentName, definition) {
    if (definition.type === "string" &&
        definition.minLength !== undefined &&
        definition.maxLength !== undefined &&
        definition.minLength > definition.maxLength) {
        throw new Error(`Argument "${argumentName}" in command "${commandName}" ` +
            "has minLength greater than maxLength.");
    }
    if ((definition.type === "integer" || definition.type === "number") &&
        definition.min !== undefined &&
        definition.max !== undefined &&
        definition.min > definition.max) {
        throw new Error(`Argument "${argumentName}" in command "${commandName}" ` +
            "has min greater than max.");
    }
    if (hasChoices(definition)) {
        validateChoices(commandName, argumentName, definition);
    }
    if (definition.type === "string") {
        validateStringChoiceAliases(commandName, argumentName, definition);
    }
}
function validateValueDefinition(commandName, argumentName, definition) {
    if (definition.value.type !== "union") {
        validateScalarValue(commandName, argumentName, definition.value);
    }
    else {
        if (definition.value.variants.length < 2) {
            throw new Error(`Union argument "${argumentName}" in command ` +
                `"${commandName}" must contain at least two variants.`);
        }
        if (!Number.isInteger(definition.value.slashVariant) ||
            definition.value.slashVariant < 0 ||
            definition.value.slashVariant >= definition.value.variants.length) {
            throw new Error(`Union argument "${argumentName}" in command ` +
                `"${commandName}" has invalid slashVariant ` +
                `${definition.value.slashVariant}.`);
        }
        for (const variant of definition.value.variants) {
            validateScalarValue(commandName, argumentName, variant);
        }
    }
    const slashValue = getSlashValueDefinition(definition.value);
    if (definition.autocomplete !== undefined &&
        !isAutocompletableValueDefinition(slashValue)) {
        throw new Error(`Argument "${argumentName}" in command "${commandName}" ` +
            `cannot use autocomplete with slash type ` +
            `"${slashValue.type}".`);
    }
    if (definition.autocomplete !== undefined &&
        hasChoices(slashValue) &&
        slashValue.choices !== undefined) {
        throw new Error(`Argument "${argumentName}" in command "${commandName}" ` +
            "cannot define both static choices and autocomplete.");
    }
}
function validateNamedOptionAliases(commandName, schema) {
    const schemaNames = new Set(Object.keys(schema));
    const optionNames = new Map();
    for (const [name, definition] of Object.entries(schema)) {
        if (definition.placement !== "option") {
            continue;
        }
        optionNames.set(name, name);
    }
    for (const [name, definition] of Object.entries(schema)) {
        if (definition.placement !== "option") {
            continue;
        }
        for (const alias of definition.aliases) {
            if (!ARGUMENT_NAME_PATTERN.test(alias)) {
                throw new Error(`Alias "${alias}" for option "${name}" in ` +
                    `command "${commandName}" must contain only ` +
                    "lowercase letters, numbers, hyphens, or " +
                    "underscores and must be 1 to 32 characters long.");
            }
            if (alias === name) {
                throw new Error(`Option "${name}" in command "${commandName}" ` +
                    "cannot list its own name as an alias.");
            }
            if (schemaNames.has(alias)) {
                throw new Error(`Alias "${alias}" for option "${name}" in ` +
                    `command "${commandName}" conflicts with an ` +
                    "argument name.");
            }
            const existing = optionNames.get(alias);
            if (existing !== undefined) {
                if (existing === name) {
                    throw new Error(`Option "${name}" in command "${commandName}" ` +
                        `lists alias "${alias}" more than once.`);
                }
                throw new Error(`Message option name "${alias}" is used by both ` +
                    `"${existing}" and "${name}" in command ` +
                    `"${commandName}".`);
            }
            optionNames.set(alias, name);
        }
    }
}
/**
 * Validates an argument schema at boot time.
 */
export function validateArgumentSchema(commandName, schema) {
    const entries = Object.entries(schema);
    if (entries.length > 25) {
        throw new Error(`Command "${commandName}" cannot have more than 25 arguments.`);
    }
    let foundOptionalPositional = false;
    let foundRestPositional = false;
    for (const [name, definition] of entries) {
        if (!ARGUMENT_NAME_PATTERN.test(name)) {
            throw new Error(`Command "${commandName}" has an invalid argument ` +
                `name: "${name}".`);
        }
        if (definition.description.length < 1 ||
            definition.description.length > 100) {
            throw new Error(`Argument "${name}" in command "${commandName}" must ` +
                "have a description between 1 and 100 characters.");
        }
        validateValueDefinition(commandName, name, definition);
        if (definition.placement !== "positional") {
            continue;
        }
        if (foundRestPositional) {
            throw new Error(`Positional argument "${name}" cannot appear after ` +
                `a rest argument in command "${commandName}".`);
        }
        if (definition.rest) {
            foundRestPositional = true;
        }
        if (definition.required) {
            if (foundOptionalPositional) {
                throw new Error(`Required positional argument "${name}" cannot ` +
                    `appear after an optional positional argument ` +
                    `in command "${commandName}".`);
            }
        }
        else {
            foundOptionalPositional = true;
        }
    }
    validateNamedOptionAliases(commandName, schema);
}
/**
 * Generates message-command usage text.
 *
 * Example:
 *
 * <user> --amount=<integer> [--reason=<string>] [--silent[=<boolean>]]
 */
export function formatArgumentUsage(schema) {
    return Object.entries(schema)
        .map(([name, definition]) => {
        const valueLabel = describeValueDefinition(definition.value);
        if (definition.placement === "positional") {
            const label = definition.rest ? `${name}...` : name;
            return definition.required ? `<${label}>` : `[${label}]`;
        }
        const label = isMessageFlagValueDefinition(definition.value)
            ? `--${name}[=<${valueLabel}>]`
            : `--${name}=<${valueLabel}>`;
        return definition.required ? label : `[${label}]`;
    })
        .join(" ");
}
//# sourceMappingURL=utils.js.map