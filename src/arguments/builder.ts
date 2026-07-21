import type { GuildMember, Role, User } from "discord.js";
import { z } from "zod";
import { parseNaturalTime } from "./timeParser";
import { resolveTimezone } from "./timezoneParser";
import type {
    BooleanArgumentDefinition,
    BooleanArgumentOptions,
    IntegerArgumentDefinition,
    IntegerArgumentOptions,
    MemberArgumentDefinition,
    MemberArgumentOptions,
    NumberArgumentDefinition,
    NumberArgumentOptions,
    RoleArgumentDefinition,
    RoleArgumentOptions,
    StringArgumentDefinition,
    StringArgumentOptions,
    TimeArgumentDefinition,
    TimeArgumentOptions,
    TimezoneArgumentDefinition,
    TimezoneArgumentOptions,
    UrlArgumentDefinition,
    UrlArgumentOptions,
    UserArgumentDefinition,
    UserArgumentOptions,
} from "./types";

function requiredValue<Required extends boolean>(
    required: Required | undefined,
): Required {
    return (required ?? false) as Required;
}

function restValue(rest: boolean | undefined): boolean {
    return rest ?? false;
}

function applyRequired<Output, Required extends boolean>(
    schema: z.ZodType<Output>,
    required: Required,
): z.ZodType<Required extends true ? Output : Output | null> {
    return (required ? schema : schema.nullable()) as z.ZodType<
        Required extends true ? Output : Output | null
    >;
}

/**
 * Factory object for creating strongly-typed command argument definitions.
 */
export const argument = {
    /** Constructs a string argument definition. */
    string<const Required extends boolean = false>(
        options: StringArgumentOptions<Required>,
    ): StringArgumentDefinition<Required> {
        let schema = z.string({
            error: "Must be a string.",
        });

        if (options.minLength !== undefined) {
            schema = schema.min(options.minLength, {
                message: `Must contain at least ${options.minLength} characters.`,
            });
        }

        if (options.maxLength !== undefined) {
            schema = schema.max(options.maxLength, {
                message: `Cannot contain more than ${options.maxLength} characters.`,
            });
        }

        const isRequired = requiredValue(options.required);
        const finalSchema = applyRequired(schema, isRequired);

        return {
            type: "string",
            description: options.description,
            required: isRequired,
            rest: restValue(options.rest),
            minLength: options.minLength,
            maxLength: options.maxLength,
            _schema: finalSchema,
        };
    },

    /** Constructs an integer argument definition. Input is coerced automatically. */
    integer<const Required extends boolean = false>(
        options: IntegerArgumentOptions<Required>,
    ): IntegerArgumentDefinition<Required> {
        let numberSchema = z
            .number({ error: "Must be a valid number." })
            .int({ message: "Must be a whole number." });

        if (options.min !== undefined) {
            numberSchema = numberSchema.min(options.min, {
                message: `Must be at least ${options.min}.`,
            });
        }

        if (options.max !== undefined) {
            numberSchema = numberSchema.max(options.max, {
                message: `Cannot be more than ${options.max}.`,
            });
        }

        const schema = z.preprocess((val) => {
            if (typeof val === "number") return val;
            if (typeof val === "string" && /^[+-]?\d+$/u.test(val.trim())) {
                return Number(val);
            }
            return val;
        }, numberSchema);

        const isRequired = requiredValue(options.required);
        const finalSchema = applyRequired(schema, isRequired);

        return {
            type: "integer",
            description: options.description,
            required: isRequired,
            rest: restValue(options.rest),
            min: options.min,
            max: options.max,
            _schema: finalSchema,
        };
    },

    /** Constructs a floating-point number argument definition. */
    number<const Required extends boolean = false>(
        options: NumberArgumentOptions<Required>,
    ): NumberArgumentDefinition<Required> {
        let numberSchema = z.number({
            error: "Must be a valid number.",
        });

        if (options.min !== undefined) {
            numberSchema = numberSchema.min(options.min, {
                message: `Must be at least ${options.min}.`,
            });
        }

        if (options.max !== undefined) {
            numberSchema = numberSchema.max(options.max, {
                message: `Cannot be more than ${options.max}.`,
            });
        }

        const schema = z.preprocess((val) => {
            if (typeof val === "number") return val;
            if (typeof val === "string" && val.trim().length > 0) {
                const parsed = Number(val);
                if (!Number.isNaN(parsed)) return parsed;
            }
            return val;
        }, numberSchema);

        const isRequired = requiredValue(options.required);
        const finalSchema = applyRequired(schema, isRequired);

        return {
            type: "number",
            description: options.description,
            required: isRequired,
            rest: restValue(options.rest),
            min: options.min,
            max: options.max,
            _schema: finalSchema,
        };
    },

    /** Constructs a boolean argument. Accepts various truthy/falsy string representations. */
    boolean<const Required extends boolean = false>(
        options: BooleanArgumentOptions<Required>,
    ): BooleanArgumentDefinition<Required> {
        const trueValues = ["true", "yes", "y", "1", "on", "enable", "enabled"];
        const falseValues = [
            "false",
            "no",
            "n",
            "0",
            "off",
            "disable",
            "disabled",
        ];

        const schema = z.preprocess(
            (val) => {
                if (typeof val === "boolean") return val;
                if (typeof val === "string") {
                    const normalized = val.toLowerCase().trim();
                    if (trueValues.includes(normalized)) return true;
                    if (falseValues.includes(normalized)) return false;
                }
                return val;
            },
            z.boolean({ error: "Must be true or false." }),
        );

        const isRequired = requiredValue(options.required);
        const finalSchema = applyRequired(schema, isRequired);

        return {
            type: "boolean",
            description: options.description,
            required: isRequired,
            rest: restValue(options.rest),
            _schema: finalSchema,
        };
    },

    /** Constructs a Discord User argument definition. */
    user<const Required extends boolean = false>(
        options: UserArgumentOptions<Required>,
    ): UserArgumentDefinition<Required> {
        const schema = z.custom<User>(
            (val) => val !== null && typeof val === "object" && "id" in val,
            { message: "Could not resolve a valid user." },
        );

        const isRequired = requiredValue(options.required);
        const finalSchema = applyRequired(schema, isRequired);

        return {
            type: "user",
            description: options.description,
            required: isRequired,
            rest: restValue(options.rest),
            _schema: finalSchema,
        };
    },

    /** Constructs a Discord GuildMember argument definition. */
    member<const Required extends boolean = false>(
        options: MemberArgumentOptions<Required>,
    ): MemberArgumentDefinition<Required> {
        const schema = z.custom<GuildMember>(
            (val) => val !== null && typeof val === "object" && "user" in val,
            { message: "Could not resolve a valid server member." },
        );

        const isRequired = requiredValue(options.required);
        const finalSchema = applyRequired(schema, isRequired);

        return {
            type: "member",
            description: options.description,
            required: isRequired,
            rest: restValue(options.rest),
            _schema: finalSchema,
        };
    },

    /** Constructs a Discord Role argument definition. */
    role<const Required extends boolean = false>(
        options: RoleArgumentOptions<Required>,
    ): RoleArgumentDefinition<Required> {
        const schema = z.custom<Role>(
            (val) => val !== null && typeof val === "object" && "name" in val,
            { message: "Could not resolve a valid role." },
        );

        const isRequired = requiredValue(options.required);
        const finalSchema = applyRequired(schema, isRequired);

        return {
            type: "role",
            description: options.description,
            required: isRequired,
            rest: restValue(options.rest),
            ...(options.allowedRoleIds !== undefined
                ? { allowedRoleIds: options.allowedRoleIds }
                : {}),
            _schema: finalSchema,
        };
    },

    url<const Required extends boolean = false>(
        options: UrlArgumentOptions<Required>,
    ): UrlArgumentDefinition<Required> {
        const schema = z
            .url({
                pattern: options.pattern,
                hostname: options.hostname,
                protocol: options.protocol,
                error: "Must be a valid URL.",
            })
            .transform((value) => new URL(value));

        const isRequired = requiredValue(options.required);
        const finalSchema = applyRequired(schema, isRequired);

        return {
            type: "url",
            description: options.description,
            required: isRequired,
            rest: restValue(options.rest),
            pattern: options.pattern,
            hostname: options.hostname,
            protocol: options.protocol,
            _schema: finalSchema,
        };
    },

    /** Constructs an IANA timezone argument from names, cities, or safe aliases. */
    timezone<const Required extends boolean = false>(
        options: TimezoneArgumentOptions<Required>,
    ): TimezoneArgumentDefinition<Required> {
        const schema = z
            .string({
                error: "Must be a timezone.",
            })
            .transform((value, context) => {
                const timezone = resolveTimezone(value);

                if (!timezone) {
                    context.addIssue({
                        code: "custom",
                        message: "Could not resolve a valid timezone.",
                    });

                    return z.NEVER;
                }

                return timezone;
            });

        const isRequired = requiredValue(options.required);
        const finalSchema = applyRequired(schema, isRequired);

        return {
            type: "timezone",
            description: options.description,
            required: isRequired,
            rest: restValue(options.rest),
            _schema: finalSchema,
        };
    },

    /** Constructs a natural-language date/time argument parsed by Chrono. */
    time<const Required extends boolean = false>(
        options: TimeArgumentOptions<Required>,
    ): TimeArgumentDefinition<Required> {
        const resolvedTimezone = options.timezone
            ? resolveTimezone(options.timezone)
            : null;

        if (options.timezone && !resolvedTimezone) {
            throw new Error(
                `Invalid time argument timezone: "${options.timezone}".`,
            );
        }

        const timezone = resolvedTimezone ?? undefined;
        const forwardDate = options.forwardDate ?? false;
        const strict = options.strict ?? false;

        const schema = z
            .string({
                error: "Must be a date or time expression.",
            })
            .transform((value, context) => {
                const reference =
                    typeof options.reference === "function"
                        ? options.reference()
                        : options.reference;

                const parsed = parseNaturalTime(value, {
                    reference,
                    timezone,
                    forwardDate,
                    strict,
                });

                if (!parsed) {
                    context.addIssue({
                        code: "custom",
                        message: "Could not parse a valid date or time.",
                    });

                    return z.NEVER;
                }

                return parsed;
            });

        const isRequired = requiredValue(options.required);
        const finalSchema = applyRequired(schema, isRequired);

        return {
            type: "time",
            description: options.description,
            required: isRequired,
            rest: restValue(options.rest),
            timezone,
            forwardDate,
            strict,
            _schema: finalSchema,
        };
    },
};
