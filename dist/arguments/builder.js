import { value } from "./value";
function resolveRequired(required) {
    return (required ?? false);
}
function getChoices(choices) {
    return choices;
}
function createPositionalDefinition(valueDefinition, options) {
    return {
        placement: "positional",
        description: options.description,
        required: resolveRequired(options.required),
        rest: options.rest ?? false,
        value: valueDefinition,
        autocomplete: options.autocomplete,
    };
}
function createNamedDefinition(valueDefinition, options) {
    return {
        placement: "option",
        description: options.description,
        required: resolveRequired(options.required),
        short: options.short,
        longAliases: options.longAliases ?? [],
        value: valueDefinition,
        autocomplete: options.autocomplete,
    };
}
/**
 * Factory for positional command arguments.
 *
 * Positional placement only affects message commands. Discord application
 * command options are always named.
 */
export const argument = {
    /** Constructs a positional string argument. */
    string(options) {
        const valueDefinition = value.string({
            minLength: options.minLength,
            maxLength: options.maxLength,
            choices: getChoices(options.choices),
            aliases: options.aliases,
        });
        return createPositionalDefinition(valueDefinition, options);
    },
    /** Constructs a positional integer argument. */
    integer(options) {
        const valueDefinition = value.integer({
            min: options.min,
            max: options.max,
            choices: getChoices(options.choices),
        });
        return createPositionalDefinition(valueDefinition, options);
    },
    /** Constructs a positional number argument. */
    number(options) {
        const valueDefinition = value.number({
            min: options.min,
            max: options.max,
            choices: getChoices(options.choices),
        });
        return createPositionalDefinition(valueDefinition, options);
    },
    /** Constructs a positional boolean argument. */
    boolean(options) {
        return createPositionalDefinition(value.boolean(), options);
    },
    /** Constructs a positional Discord user argument. */
    user(options) {
        return createPositionalDefinition(value.user(), options);
    },
    /** Constructs a positional Discord guild-member argument. */
    member(options) {
        return createPositionalDefinition(value.member(), options);
    },
    /** Constructs a positional Discord role argument. */
    role(options) {
        return createPositionalDefinition(value.role({
            allowedRoleIds: options.allowedRoleIds,
        }), options);
    },
    /** Constructs a positional URL argument. */
    url(options) {
        return createPositionalDefinition(value.url({
            pattern: options.pattern,
            hostname: options.hostname,
            protocol: options.protocol,
        }), options);
    },
    /** Constructs a positional timezone argument. */
    timezone(options) {
        return createPositionalDefinition(value.timezone(), options);
    },
    /** Constructs a positional natural-language time argument. */
    time(options) {
        return createPositionalDefinition(value.time({
            reference: options.reference,
            timezone: options.timezone,
            forwardDate: options.forwardDate,
            strict: options.strict,
        }), options);
    },
    /**
     * Constructs a positional union argument.
     *
     * Message commands try variants in declaration order.
     */
    union(options) {
        return createPositionalDefinition(value.union(options.variants, {
            slashVariant: options.slashVariant,
        }), options);
    },
};
/**
 * Factory for named message-command options.
 *
 * Named options support the preferred `name:value` syntax and GNU-style
 * `--name value`, `--name=value`, and short aliases.
 */
export const option = {
    /** Constructs a named string option. */
    string(options) {
        const valueDefinition = value.string({
            minLength: options.minLength,
            maxLength: options.maxLength,
            choices: getChoices(options.choices),
            aliases: options.aliases,
        });
        return createNamedDefinition(valueDefinition, options);
    },
    /** Constructs a named integer option. */
    integer(options) {
        const valueDefinition = value.integer({
            min: options.min,
            max: options.max,
            choices: getChoices(options.choices),
        });
        return createNamedDefinition(valueDefinition, options);
    },
    /** Constructs a named number option. */
    number(options) {
        const valueDefinition = value.number({
            min: options.min,
            max: options.max,
            choices: getChoices(options.choices),
        });
        return createNamedDefinition(valueDefinition, options);
    },
    /** Constructs a named boolean option. */
    boolean(options) {
        return createNamedDefinition(value.boolean(), options);
    },
    /** Constructs a named Discord user option. */
    user(options) {
        return createNamedDefinition(value.user(), options);
    },
    /** Constructs a named Discord guild-member option. */
    member(options) {
        return createNamedDefinition(value.member(), options);
    },
    /** Constructs a named Discord role option. */
    role(options) {
        return createNamedDefinition(value.role({
            allowedRoleIds: options.allowedRoleIds,
        }), options);
    },
    /** Constructs a named URL option. */
    url(options) {
        return createNamedDefinition(value.url({
            pattern: options.pattern,
            hostname: options.hostname,
            protocol: options.protocol,
        }), options);
    },
    /** Constructs a named timezone option. */
    timezone(options) {
        return createNamedDefinition(value.timezone(), options);
    },
    /** Constructs a named natural-language time option. */
    time(options) {
        return createNamedDefinition(value.time({
            reference: options.reference,
            timezone: options.timezone,
            forwardDate: options.forwardDate,
            strict: options.strict,
        }), options);
    },
    /**
     * Constructs a named union option.
     *
     * Message commands try variants in declaration order.
     */
    union(options) {
        return createNamedDefinition(value.union(options.variants, {
            slashVariant: options.slashVariant,
        }), options);
    },
};
//# sourceMappingURL=builder.js.map