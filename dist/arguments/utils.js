/**
 * Mutates a SlashCommandBuilder by automatically appending options derived from an ArgumentSchema.
 *
 * @param builder - The Discord.js SlashCommandBuilder instance.
 * @param schema - The schema defining the command's arguments.
 */
export function addArgumentsToSlashCommand(builder, schema) {
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
                    return option;
                });
                break;
            case "timezone":
            case "time":
            case "url":
                builder.addStringOption((option) => option
                    .setName(name)
                    .setDescription(definition.description)
                    .setRequired(definition.required));
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
                    return option;
                });
                break;
            case "boolean":
                builder.addBooleanOption((option) => option
                    .setName(name)
                    .setDescription(definition.description)
                    .setRequired(definition.required));
                break;
            case "user":
            case "member":
                builder.addUserOption((option) => option
                    .setName(name)
                    .setDescription(definition.description)
                    .setRequired(definition.required));
                break;
            case "role":
                builder.addRoleOption((option) => option
                    .setName(name)
                    .setDescription(definition.description)
                    .setRequired(definition.required));
                break;
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
export function validateArgumentSchema(commandName, schema) {
    const entries = Object.entries(schema);
    let foundOptional = false;
    let foundRest = false;
    if (entries.length > 25) {
        throw new Error(`Command "${commandName}" cannot have more than 25 arguments.`);
    }
    for (const [name, definition] of entries) {
        if (!/^[a-z0-9_-]{1,32}$/u.test(name)) {
            throw new Error(`Command "${commandName}" has an invalid argument name: "${name}".`);
        }
        if (definition.description.length < 1 ||
            definition.description.length > 100) {
            throw new Error(`Argument "${name}" in command "${commandName}" must have a description between 1 and 100 characters.`);
        }
        if (foundRest) {
            throw new Error(`Argument "${name}" cannot appear after a rest argument in command "${commandName}".`);
        }
        if (definition.rest) {
            foundRest = true;
        }
        if (definition.required) {
            if (foundOptional) {
                throw new Error(`Required argument "${name}" cannot appear after an optional argument in command "${commandName}".`);
            }
        }
        else {
            foundOptional = true;
        }
        if (definition.type === "string" &&
            definition.minLength !== undefined &&
            definition.maxLength !== undefined &&
            definition.minLength > definition.maxLength) {
            throw new Error(`Argument "${name}" in command "${commandName}" has minLength greater than maxLength.`);
        }
        if ((definition.type === "integer" || definition.type === "number") &&
            definition.min !== undefined &&
            definition.max !== undefined &&
            definition.min > definition.max) {
            throw new Error(`Argument "${name}" in command "${commandName}" has min greater than max.`);
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
export function formatArgumentUsage(schema) {
    return Object.entries(schema)
        .map(([name, definition]) => {
        const label = definition.rest ? `${name}...` : name;
        return definition.required ? `<${label}>` : `[${label}]`;
    })
        .join(" ");
}
//# sourceMappingURL=utils.js.map