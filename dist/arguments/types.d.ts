import type { AutocompleteInteraction, GuildMember, Role, User } from "discord.js";
import type { z } from "zod";
/**
 * Values Discord accepts for application-command choices and autocomplete.
 */
export type ArgumentChoiceValue = string | number;
/**
 * Static or dynamically generated argument choices.
 *
 * Arrays use the value itself as the display name. Objects map display names
 * to their underlying values.
 */
export type ArgumentChoices<Value extends ArgumentChoiceValue> = readonly Value[] | Readonly<Record<string, Value>>;
/**
 * Infers the literal value represented by an argument's choices.
 */
export type InferArgumentChoiceValue<Choices, Fallback extends ArgumentChoiceValue> = Choices extends readonly (infer Value extends Fallback)[] ? Value : Choices extends Readonly<Record<string, infer Value extends Fallback>> ? Value : Fallback;
/**
 * Message-only aliases for string choice values.
 *
 * Example:
 *
 * aliases: {
 *     rg: "reactions_given",
 *     rr: "reactions_received",
 * }
 */
export type StringChoiceAliases<Value extends string> = Readonly<Record<string, Value>>;
/**
 * Context supplied to a slash-command autocomplete callback.
 */
export interface ArgumentAutocompleteContext {
    /**
     * Raw Discord autocomplete interaction.
     */
    interaction: AutocompleteInteraction;
    /**
     * Canonical argument name.
     */
    name: string;
    /**
     * Current text entered by the user.
     *
     * Discord reports focused autocomplete values as strings, including for
     * numeric application-command options.
     */
    value: string;
}
/**
 * Slash-command autocomplete callback.
 */
export type ArgumentAutocompleteHandler<Value extends ArgumentChoiceValue = ArgumentChoiceValue> = (context: ArgumentAutocompleteContext) => ArgumentChoices<Value> | Promise<ArgumentChoices<Value>>;
/**
 * Common runtime representation for a semantic argument value.
 *
 * A value definition describes what a value means. It does not describe
 * whether that value is supplied positionally or through a named option.
 */
export interface BaseValueDefinition<Type extends string, Output> {
    type: Type;
    /**
     * Runtime validation and transformation schema.
     *
     * @internal
     */
    _schema: z.ZodType<Output>;
}
/**
 * Semantic string value.
 */
export interface StringValueDefinition<Value extends string = string> extends BaseValueDefinition<"string", Value> {
    minLength?: number;
    maxLength?: number;
    choices?: ArgumentChoices<string>;
    /**
     * Message-only aliases for choice values.
     */
    aliases?: StringChoiceAliases<Value>;
}
/**
 * Semantic integer value.
 */
export interface IntegerValueDefinition<Value extends number = number> extends BaseValueDefinition<"integer", Value> {
    min?: number;
    max?: number;
    choices?: ArgumentChoices<number>;
}
/**
 * Semantic floating-point value.
 */
export interface NumberValueDefinition<Value extends number = number> extends BaseValueDefinition<"number", Value> {
    min?: number;
    max?: number;
    choices?: ArgumentChoices<number>;
}
/**
 * Semantic boolean value.
 */
export type BooleanValueDefinition = BaseValueDefinition<"boolean", boolean>;
/**
 * Semantic Discord user value.
 */
export type UserValueDefinition = BaseValueDefinition<"user", User>;
/**
 * Semantic Discord guild-member value.
 */
export type MemberValueDefinition = BaseValueDefinition<"member", GuildMember>;
/**
 * Semantic Discord role value.
 */
export interface RoleValueDefinition extends BaseValueDefinition<"role", Role> {
    allowedRoleIds?: readonly string[];
}
/**
 * Semantic URL value.
 */
export interface UrlValueDefinition extends BaseValueDefinition<"url", URL> {
    pattern?: RegExp;
    hostname?: RegExp;
    protocol?: RegExp;
}
/**
 * Semantic IANA timezone value.
 */
export type TimezoneValueDefinition = BaseValueDefinition<"timezone", string>;
/**
 * Semantic natural-language time value.
 */
export interface TimeValueDefinition extends BaseValueDefinition<"time", Date> {
    timezone?: string;
    forwardDate: boolean;
    strict: boolean;
}
/**
 * Value definitions that map directly onto one runtime parser.
 */
export type ScalarValueDefinition = StringValueDefinition | IntegerValueDefinition | NumberValueDefinition | BooleanValueDefinition | UserValueDefinition | MemberValueDefinition | RoleValueDefinition | UrlValueDefinition | TimezoneValueDefinition | TimeValueDefinition;
/**
 * Semantic union of multiple possible value types.
 *
 * Prefix commands try variants in declaration order.
 *
 * Slash commands cannot express heterogeneous option types, so one variant is
 * selected as the slash-command representation.
 */
export interface UnionValueDefinition<Variants extends readonly ScalarValueDefinition[] = readonly ScalarValueDefinition[]> {
    type: "union";
    /**
     * Prefix-command parsers to try, in order.
     */
    variants: Variants;
    /**
     * Variant used to represent this value as a Discord slash option.
     */
    slashVariant: number;
}
/**
 * Any semantic command value.
 */
export type ArgumentValueDefinition = ScalarValueDefinition | UnionValueDefinition;
/**
 * Infers the final TypeScript output of a semantic value definition.
 */
export type InferArgumentValue<Value extends ArgumentValueDefinition> = Value extends ScalarValueDefinition ? Value["_schema"] extends z.ZodType<infer Output> ? Output : never : Value extends UnionValueDefinition<infer Variants> ? InferArgumentValue<Variants[number]> : never;
/**
 * Common configuration shared by positional arguments and named options.
 */
export interface BaseInputOptions<Required extends boolean> {
    /**
     * Description displayed in slash commands and help output.
     */
    description: string;
    /**
     * Whether the value must be supplied.
     *
     * @defaultValue false
     */
    required?: Required;
}
/**
 * Configuration specific to positional message arguments.
 */
export interface PositionalInputOptions<Required extends boolean> extends BaseInputOptions<Required> {
    /**
     * Consumes every remaining positional token.
     *
     * Named options are removed before positional assignment, so options may
     * still appear before or after a rest argument in message commands.
     *
     * @defaultValue false
     */
    rest?: boolean;
}
/**
 * Configuration specific to named message options.
 */
export interface NamedInputOptions<Required extends boolean> extends BaseInputOptions<Required> {
    /**
     * Optional one-character GNU-style alias.
     *
     * Example:
     *
     * short: "a"
     *
     * permits:
     *
     * -a 500
     */
    short?: string;
    /**
     * Additional long names accepted by message commands.
     *
     * Example:
     *
     * longAliases: ["xp"]
     *
     * permits:
     *
     * xp:500
     * --xp 500
     *
     * Slash commands always use the canonical schema key.
     */
    longAliases?: readonly string[];
}
/**
 * A positional argument binding.
 */
export interface PositionalArgumentDefinition<Value extends ArgumentValueDefinition = ArgumentValueDefinition, Required extends boolean = boolean> {
    placement: "positional";
    description: string;
    required: Required;
    rest: boolean;
    value: Value;
    autocomplete?: ArgumentAutocompleteHandler;
}
/**
 * A named option binding.
 */
export interface NamedOptionDefinition<Value extends ArgumentValueDefinition = ArgumentValueDefinition, Required extends boolean = boolean> {
    placement: "option";
    description: string;
    required: Required;
    short?: string;
    longAliases: readonly string[];
    value: Value;
    autocomplete?: ArgumentAutocompleteHandler;
}
/**
 * Any input definition supported by a command.
 */
export type CommandArgumentDefinition = PositionalArgumentDefinition | NamedOptionDefinition;
/**
 * Command input schema.
 *
 * Both positional arguments and named options live in the same schema so the
 * command handler receives one strongly typed `ctx.args` object.
 */
export type ArgumentSchema = Readonly<Record<string, CommandArgumentDefinition>>;
type InferParsedArgument<Definition extends CommandArgumentDefinition> = Definition extends {
    value: infer Value extends ArgumentValueDefinition;
    required: true;
} ? InferArgumentValue<Value> : Definition extends {
    value: infer Value extends ArgumentValueDefinition;
} ? InferArgumentValue<Value> | null : never;
/**
 * Infers the final command-handler argument object from a schema.
 */
export type ParsedArguments<Schema extends ArgumentSchema> = {
    [Name in keyof Schema]: InferParsedArgument<Schema[Name]>;
};
/**
 * Options belonging to a semantic value that supports choices.
 *
 * Unlike command bindings, semantic values do not have autocomplete, so
 * choices can simply be represented as an optional generic property.
 */
type ValueChoiceOptions<Choices extends ArgumentChoices<ArgumentChoiceValue> | undefined> = {
    choices?: Choices;
};
type ChoiceOrAutocompleteOptions<Value extends ArgumentChoiceValue, Choices extends ArgumentChoices<Value> | undefined> = Choices extends undefined ? {
    choices?: undefined;
    autocomplete?: ArgumentAutocompleteHandler<Value>;
} : {
    choices: Choices;
    autocomplete?: never;
};
type StringConstraints<Choices extends ArgumentChoices<string> | undefined> = {
    minLength?: number;
    maxLength?: number;
    /**
     * Message-only aliases for static choice values.
     */
    aliases?: Choices extends undefined ? never : StringChoiceAliases<InferArgumentChoiceValue<Choices, string>>;
};
type NumberConstraints = {
    min?: number;
    max?: number;
};
/**
 * Options for constructing a standalone semantic string value.
 */
export type StringValueOptions<Choices extends ArgumentChoices<string> | undefined = undefined> = {
    minLength?: number;
    maxLength?: number;
    choices?: Choices;
    /**
     * Message-only aliases for static choice values.
     */
    aliases?: Choices extends undefined ? never : StringChoiceAliases<InferArgumentChoiceValue<Choices, string>>;
};
/**
 * Options for a positional string argument.
 */
export type StringArgumentOptions<Required extends boolean = false, Choices extends ArgumentChoices<string> | undefined = undefined> = PositionalInputOptions<Required> & StringConstraints<Choices> & ChoiceOrAutocompleteOptions<string, Choices>;
/**
 * Options for a named string option.
 */
export type StringOptionOptions<Required extends boolean = false, Choices extends ArgumentChoices<string> | undefined = undefined> = NamedInputOptions<Required> & StringConstraints<Choices> & ChoiceOrAutocompleteOptions<string, Choices>;
/**
 * Options for constructing a standalone semantic integer value.
 */
export type IntegerValueOptions<Choices extends ArgumentChoices<number> | undefined = undefined> = NumberConstraints & ValueChoiceOptions<Choices>;
/**
 * Options for a positional integer argument.
 */
export type IntegerArgumentOptions<Required extends boolean = false, Choices extends ArgumentChoices<number> | undefined = undefined> = PositionalInputOptions<Required> & NumberConstraints & ChoiceOrAutocompleteOptions<number, Choices>;
/**
 * Options for a named integer option.
 */
export type IntegerOptionOptions<Required extends boolean = false, Choices extends ArgumentChoices<number> | undefined = undefined> = NamedInputOptions<Required> & NumberConstraints & ChoiceOrAutocompleteOptions<number, Choices>;
/**
 * Options for constructing a standalone semantic number value.
 */
export type NumberValueOptions<Choices extends ArgumentChoices<number> | undefined = undefined> = NumberConstraints & ValueChoiceOptions<Choices>;
/**
 * Options for a positional number argument.
 */
export type NumberArgumentOptions<Required extends boolean = false, Choices extends ArgumentChoices<number> | undefined = undefined> = PositionalInputOptions<Required> & NumberConstraints & ChoiceOrAutocompleteOptions<number, Choices>;
/**
 * Options for a named number option.
 */
export type NumberOptionOptions<Required extends boolean = false, Choices extends ArgumentChoices<number> | undefined = undefined> = NamedInputOptions<Required> & NumberConstraints & ChoiceOrAutocompleteOptions<number, Choices>;
/**
 * Options for a positional boolean argument.
 */
export type BooleanArgumentOptions<Required extends boolean = false> = PositionalInputOptions<Required>;
/**
 * Options for a named boolean option.
 */
export type BooleanOptionOptions<Required extends boolean = false> = NamedInputOptions<Required>;
/**
 * Options for a positional Discord user.
 */
export type UserArgumentOptions<Required extends boolean = false> = PositionalInputOptions<Required>;
/**
 * Options for a named Discord user.
 */
export type UserOptionOptions<Required extends boolean = false> = NamedInputOptions<Required>;
/**
 * Options for a positional Discord guild member.
 */
export type MemberArgumentOptions<Required extends boolean = false> = PositionalInputOptions<Required>;
/**
 * Options for a named Discord guild member.
 */
export type MemberOptionOptions<Required extends boolean = false> = NamedInputOptions<Required>;
/**
 * Semantic Discord role constraints.
 */
export interface RoleValueOptions {
    allowedRoleIds?: readonly string[];
}
/**
 * Options for a positional Discord role.
 */
export type RoleArgumentOptions<Required extends boolean = false> = PositionalInputOptions<Required> & RoleValueOptions;
/**
 * Options for a named Discord role.
 */
export type RoleOptionOptions<Required extends boolean = false> = NamedInputOptions<Required> & RoleValueOptions;
/**
 * Semantic URL constraints.
 */
export interface UrlValueOptions {
    pattern?: RegExp;
    hostname?: RegExp;
    protocol?: RegExp;
}
/**
 * Options for a positional URL.
 */
export type UrlArgumentOptions<Required extends boolean = false> = PositionalInputOptions<Required> & UrlValueOptions & {
    autocomplete?: ArgumentAutocompleteHandler<string>;
};
/**
 * Options for a named URL.
 */
export type UrlOptionOptions<Required extends boolean = false> = NamedInputOptions<Required> & UrlValueOptions & {
    autocomplete?: ArgumentAutocompleteHandler<string>;
};
/**
 * Options for a positional timezone.
 */
export type TimezoneArgumentOptions<Required extends boolean = false> = PositionalInputOptions<Required> & {
    autocomplete?: ArgumentAutocompleteHandler<string>;
};
/**
 * Options for a named timezone.
 */
export type TimezoneOptionOptions<Required extends boolean = false> = NamedInputOptions<Required> & {
    autocomplete?: ArgumentAutocompleteHandler<string>;
};
export type TimeReference = Date | (() => Date);
/**
 * Semantic natural-language time configuration.
 */
export interface TimeValueOptions {
    /**
     * Reference instant for relative expressions.
     *
     * Functions are evaluated when the command is parsed.
     */
    reference?: TimeReference;
    /**
     * Optional IANA timezone used to interpret input.
     */
    timezone?: string;
    /**
     * Prefer future dates when an expression is ambiguous.
     */
    forwardDate?: boolean;
    /**
     * Use Chrono's strict parser rather than its casual parser.
     */
    strict?: boolean;
}
/**
 * Options for a positional natural-language time argument.
 */
export type TimeArgumentOptions<Required extends boolean = false> = PositionalInputOptions<Required> & TimeValueOptions & {
    autocomplete?: ArgumentAutocompleteHandler<string>;
};
/**
 * Options for a named natural-language time option.
 */
export type TimeOptionOptions<Required extends boolean = false> = NamedInputOptions<Required> & TimeValueOptions & {
    autocomplete?: ArgumentAutocompleteHandler<string>;
};
/**
 * Options for a standalone semantic union.
 */
export interface UnionValueOptions {
    /**
     * Variant used for slash-command representation.
     *
     * @defaultValue 0
     */
    slashVariant?: number;
}
/**
 * Options for a positional union.
 */
export type UnionArgumentOptions<Required extends boolean, Variants extends readonly ScalarValueDefinition[]> = PositionalInputOptions<Required> & {
    variants: Variants;
    slashVariant?: number;
    autocomplete?: ArgumentAutocompleteHandler;
};
/**
 * Options for a named union.
 */
export type UnionOptionOptions<Required extends boolean, Variants extends readonly ScalarValueDefinition[]> = NamedInputOptions<Required> & {
    variants: Variants;
    slashVariant?: number;
    autocomplete?: ArgumentAutocompleteHandler;
};
export type StringArgumentDefinition<Required extends boolean = false, Value extends string = string> = PositionalArgumentDefinition<StringValueDefinition<Value>, Required>;
export type StringOptionDefinition<Required extends boolean = false, Value extends string = string> = NamedOptionDefinition<StringValueDefinition<Value>, Required>;
export type IntegerArgumentDefinition<Required extends boolean = false, Value extends number = number> = PositionalArgumentDefinition<IntegerValueDefinition<Value>, Required>;
export type IntegerOptionDefinition<Required extends boolean = false, Value extends number = number> = NamedOptionDefinition<IntegerValueDefinition<Value>, Required>;
export type NumberArgumentDefinition<Required extends boolean = false, Value extends number = number> = PositionalArgumentDefinition<NumberValueDefinition<Value>, Required>;
export type NumberOptionDefinition<Required extends boolean = false, Value extends number = number> = NamedOptionDefinition<NumberValueDefinition<Value>, Required>;
export type BooleanArgumentDefinition<Required extends boolean = false> = PositionalArgumentDefinition<BooleanValueDefinition, Required>;
export type BooleanOptionDefinition<Required extends boolean = false> = NamedOptionDefinition<BooleanValueDefinition, Required>;
export type UserArgumentDefinition<Required extends boolean = false> = PositionalArgumentDefinition<UserValueDefinition, Required>;
export type UserOptionDefinition<Required extends boolean = false> = NamedOptionDefinition<UserValueDefinition, Required>;
export type MemberArgumentDefinition<Required extends boolean = false> = PositionalArgumentDefinition<MemberValueDefinition, Required>;
export type MemberOptionDefinition<Required extends boolean = false> = NamedOptionDefinition<MemberValueDefinition, Required>;
export type RoleArgumentDefinition<Required extends boolean = false> = PositionalArgumentDefinition<RoleValueDefinition, Required>;
export type RoleOptionDefinition<Required extends boolean = false> = NamedOptionDefinition<RoleValueDefinition, Required>;
export type UrlArgumentDefinition<Required extends boolean = false> = PositionalArgumentDefinition<UrlValueDefinition, Required>;
export type UrlOptionDefinition<Required extends boolean = false> = NamedOptionDefinition<UrlValueDefinition, Required>;
export type TimezoneArgumentDefinition<Required extends boolean = false> = PositionalArgumentDefinition<TimezoneValueDefinition, Required>;
export type TimezoneOptionDefinition<Required extends boolean = false> = NamedOptionDefinition<TimezoneValueDefinition, Required>;
export type TimeArgumentDefinition<Required extends boolean = false> = PositionalArgumentDefinition<TimeValueDefinition, Required>;
export type TimeOptionDefinition<Required extends boolean = false> = NamedOptionDefinition<TimeValueDefinition, Required>;
export type UnionArgumentDefinition<Required extends boolean = false, Variants extends readonly ScalarValueDefinition[] = readonly ScalarValueDefinition[]> = PositionalArgumentDefinition<UnionValueDefinition<Variants>, Required>;
export type UnionOptionDefinition<Required extends boolean = false, Variants extends readonly ScalarValueDefinition[] = readonly ScalarValueDefinition[]> = NamedOptionDefinition<UnionValueDefinition<Variants>, Required>;
export type ArgumentErrorCode = "INVALID_SYNTAX" | "MISSING_ARGUMENT" | "INVALID_ARGUMENT" | "ARGUMENT_NOT_FOUND" | "TOO_MANY_ARGUMENTS" | "DUPLICATE_OPTION";
export interface ArgumentParseError {
    code: ArgumentErrorCode;
    argument?: string;
    message: string;
}
export type ArgumentParseResult<Value> = {
    success: true;
    value: Value;
} | {
    success: false;
    error: ArgumentParseError;
};
export type TokenizeResult = {
    success: true;
    tokens: string[];
} | {
    success: false;
    error: ArgumentParseError;
};
export type ResolutionResult<Value> = {
    success: true;
    value: Value;
} | {
    success: false;
    code: ArgumentErrorCode;
    message: string;
};
export {};
//# sourceMappingURL=types.d.ts.map