import type {
    AutocompleteInteraction,
    GuildMember,
    Role,
    User,
} from "discord.js";
import type { z } from "zod";

export type ArgumentChoiceValue = string | number;

export type ArgumentChoices<Value extends ArgumentChoiceValue> =
    readonly Value[] | Readonly<Record<string, Value>>;

export type InferArgumentChoiceValue<
    Choices,
    Fallback extends ArgumentChoiceValue,
> = Choices extends readonly (infer Value extends Fallback)[]
    ? Value
    : Choices extends Readonly<Record<string, infer Value extends Fallback>>
      ? Value
      : Fallback;

export interface ArgumentAutocompleteContext {
    /**
     * The raw Discord autocomplete interaction.
     *
     * This provides access to the user, guild, other supplied options, etc.
     */
    interaction: AutocompleteInteraction;

    /** Name of the argument currently being completed. */
    name: string;

    /**
     * Current user input.
     *
     * Discord exposes the focused autocomplete input as a string, including
     * for integer and number options.
     */
    value: string;
}

export type ArgumentAutocompleteHandler<Value extends ArgumentChoiceValue> = (
    context: ArgumentAutocompleteContext,
) => ArgumentChoices<Value> | Promise<ArgumentChoices<Value>>;

type ChoiceOrAutocompleteOptions<
    Value extends ArgumentChoiceValue,
    Choices extends ArgumentChoices<Value> | undefined,
> = Choices extends undefined
    ? {
          choices?: undefined;
          autocomplete?: ArgumentAutocompleteHandler<Value>;
      }
    : {
          choices: Choices;
          autocomplete?: never;
      };

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

export type StringArgumentOptions<
    Required extends boolean = false,
    Choices extends ArgumentChoices<string> | undefined = undefined,
> = BaseArgumentOptions<Required> & {
    minLength?: number;
    maxLength?: number;
} & ChoiceOrAutocompleteOptions<string, Choices>;

export interface StringArgumentDefinition<
    Required extends boolean = false,
    Value extends string = string,
> extends BaseArgumentDefinition<
    "string",
    Required,
    Required extends true ? Value : Value | null
> {
    minLength?: number;
    maxLength?: number;
    choices?: ArgumentChoices<string>;
    autocomplete?: ArgumentAutocompleteHandler<string>;
}

export type IntegerArgumentOptions<
    Required extends boolean = false,
    Choices extends ArgumentChoices<number> | undefined = undefined,
> = BaseArgumentOptions<Required> & {
    min?: number;
    max?: number;
} & ChoiceOrAutocompleteOptions<number, Choices>;

export interface IntegerArgumentDefinition<
    Required extends boolean = false,
    Value extends number = number,
> extends BaseArgumentDefinition<
    "integer",
    Required,
    Required extends true ? Value : Value | null
> {
    min?: number;
    max?: number;
    choices?: ArgumentChoices<number>;
    autocomplete?: ArgumentAutocompleteHandler<number>;
}

export type NumberArgumentOptions<
    Required extends boolean = false,
    Choices extends ArgumentChoices<number> | undefined = undefined,
> = BaseArgumentOptions<Required> & {
    min?: number;
    max?: number;
} & ChoiceOrAutocompleteOptions<number, Choices>;

export interface NumberArgumentDefinition<
    Required extends boolean = false,
    Value extends number = number,
> extends BaseArgumentDefinition<
    "number",
    Required,
    Required extends true ? Value : Value | null
> {
    min?: number;
    max?: number;
    choices?: ArgumentChoices<number>;
    autocomplete?: ArgumentAutocompleteHandler<number>;
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
    autocomplete?: ArgumentAutocompleteHandler<string>;
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
    autocomplete?: ArgumentAutocompleteHandler<string>;
}

export type TimeReference = Date | (() => Date);

export type TimezoneArgumentOptions<Required extends boolean = false> =
    BaseArgumentOptions<Required> & {
        autocomplete?: ArgumentAutocompleteHandler<string>;
    };

export type TimezoneArgumentDefinition<Required extends boolean = false> =
    BaseArgumentDefinition<
        "timezone",
        Required,
        Required extends true ? string : string | null
    > & {
        autocomplete?: ArgumentAutocompleteHandler<string>;
    };

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

    autocomplete?: ArgumentAutocompleteHandler<string>;
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
    autocomplete?: ArgumentAutocompleteHandler<string>;
}

export type CommandArgumentDefinition =
    | StringArgumentDefinition<boolean, string>
    | IntegerArgumentDefinition<boolean, number>
    | NumberArgumentDefinition<boolean, number>
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
