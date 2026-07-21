import type { GuildMember, Role, User } from "discord.js";
import type { z } from "zod";

/** Base configuration available to all argument types. */
export interface BaseArgumentOptions<Required extends boolean> {
    /** The description of the argument, shown in slash commands and help menus. */
    description: string;
    /** Whether this argument must be provided by the user. */
    required?: Required;
    /**
     * For prefix commands, consumes all remaining tokens into this single argument.
     * A rest argument must be the final argument in the schema.
     */
    rest?: boolean;
}

/** Internal representation of a parsed argument definition. */
export interface BaseArgumentDefinition<
    Type extends string,
    Required extends boolean,
    TOutput,
> {
    type: Type;
    description: string;
    required: Required;
    rest: boolean;
    /** @internal Private Zod schema for runtime validation and type inference */
    _schema: z.ZodType<TOutput>;
}

export interface StringArgumentOptions<
    Required extends boolean = false,
> extends BaseArgumentOptions<Required> {
    minLength?: number;
    maxLength?: number;
}

export interface StringArgumentDefinition<
    Required extends boolean = false,
> extends BaseArgumentDefinition<
    "string",
    Required,
    Required extends true ? string : string | null
> {
    minLength?: number;
    maxLength?: number;
}

export interface IntegerArgumentOptions<
    Required extends boolean = false,
> extends BaseArgumentOptions<Required> {
    min?: number;
    max?: number;
}

export interface IntegerArgumentDefinition<
    Required extends boolean = false,
> extends BaseArgumentDefinition<
    "integer",
    Required,
    Required extends true ? number : number | null
> {
    min?: number;
    max?: number;
}

export interface NumberArgumentOptions<
    Required extends boolean = false,
> extends BaseArgumentOptions<Required> {
    min?: number;
    max?: number;
}

export interface NumberArgumentDefinition<
    Required extends boolean = false,
> extends BaseArgumentDefinition<
    "number",
    Required,
    Required extends true ? number : number | null
> {
    min?: number;
    max?: number;
}

export type BooleanArgumentOptions<Required extends boolean = false> =
    BaseArgumentOptions<Required>;

export type BooleanArgumentDefinition<Required extends boolean = false> =
    BaseArgumentDefinition<
        "boolean",
        Required,
        Required extends true ? boolean : boolean | null
    >;

export type UserArgumentOptions<Required extends boolean = false> =
    BaseArgumentOptions<Required>;

export type UserArgumentDefinition<Required extends boolean = false> =
    BaseArgumentDefinition<
        "user",
        Required,
        Required extends true ? User : User | null
    >;

export type MemberArgumentOptions<Required extends boolean = false> =
    BaseArgumentOptions<Required>;

export type MemberArgumentDefinition<Required extends boolean = false> =
    BaseArgumentDefinition<
        "member",
        Required,
        Required extends true ? GuildMember : GuildMember | null
    >;

export interface RoleArgumentOptions<
    Required extends boolean = false,
> extends BaseArgumentOptions<Required> {
    allowedRoleIds?: readonly string[];
}

export interface RoleArgumentDefinition<
    Required extends boolean = false,
> extends BaseArgumentDefinition<
    "role",
    Required,
    Required extends true ? Role : Role | null
> {
    allowedRoleIds?: readonly string[];
}

export interface UrlArgumentOptions<
    Required extends boolean = false,
> extends BaseArgumentOptions<Required> {
    pattern?: RegExp;
    hostname?: RegExp;
    protocol?: RegExp;
}

export interface UrlArgumentDefinition<
    Required extends boolean = false,
> extends BaseArgumentDefinition<
    "url",
    Required,
    Required extends true ? URL : URL | null
> {
    pattern?: RegExp;
    hostname?: RegExp;
    protocol?: RegExp;
}

export type TimeReference = Date | (() => Date);

export type TimezoneArgumentOptions<Required extends boolean = false> =
    BaseArgumentOptions<Required>;

export type TimezoneArgumentDefinition<Required extends boolean = false> =
    BaseArgumentDefinition<
        "timezone",
        Required,
        Required extends true ? string : string | null
    >;

export interface TimeArgumentOptions<
    Required extends boolean = false,
> extends BaseArgumentOptions<Required> {
    /**
     * Reference instant used for relative expressions.
     *
     * A function is evaluated when the command is parsed rather than when the
     * command definition is created.
     */
    reference?: TimeReference;

    /** Optional IANA timezone in which the expression is interpreted. */
    timezone?: string;

    /** Prefer future dates for otherwise ambiguous expressions. */
    forwardDate?: boolean;

    /** Use Chrono's strict parser instead of its casual parser. */
    strict?: boolean;
}

export interface TimeArgumentDefinition<
    Required extends boolean = false,
> extends BaseArgumentDefinition<
    "time",
    Required,
    Required extends true ? Date : Date | null
> {
    timezone?: string;
    forwardDate: boolean;
    strict: boolean;
}

export type CommandArgumentDefinition =
    | StringArgumentDefinition<boolean>
    | IntegerArgumentDefinition<boolean>
    | NumberArgumentDefinition<boolean>
    | BooleanArgumentDefinition<boolean>
    | UserArgumentDefinition<boolean>
    | MemberArgumentDefinition<boolean>
    | RoleArgumentDefinition<boolean>
    | UrlArgumentDefinition<boolean>
    | TimezoneArgumentDefinition<boolean>
    | TimeArgumentDefinition<boolean>;

/** A collection of argument definitions that make up a command's structure. */
export type ArgumentSchema = Readonly<
    Record<string, CommandArgumentDefinition>
>;

/** Infers the final output types from a given ArgumentSchema. */
export type ParsedArguments<Schema extends ArgumentSchema> = {
    [Name in keyof Schema]: Schema[Name] extends {
        _schema: z.ZodType<infer TOutput>;
    }
        ? TOutput
        : never;
};

export type ArgumentErrorCode =
    | "INVALID_SYNTAX"
    | "MISSING_ARGUMENT"
    | "INVALID_ARGUMENT"
    | "ARGUMENT_NOT_FOUND"
    | "ARGUMENT_OUT_OF_RANGE"
    | "TOO_MANY_ARGUMENTS";

export interface ArgumentParseError {
    code: ArgumentErrorCode;
    argument?: string;
    message: string;
}

export type ArgumentParseResult<Value> =
    | { success: true; value: Value }
    | { success: false; error: ArgumentParseError };

export type TokenizeResult =
    | { success: true; tokens: string[] }
    | { success: false; error: ArgumentParseError };

export type ResolutionResult<Value> =
    | { success: true; value: Value }
    | { success: false; code: ArgumentErrorCode; message: string };
