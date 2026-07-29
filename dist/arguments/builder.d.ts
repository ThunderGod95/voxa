import type { ArgumentChoices, BooleanArgumentDefinition, BooleanArgumentOptions, BooleanOptionDefinition, BooleanOptionOptions, InferArgumentChoiceValue, IntegerArgumentDefinition, IntegerArgumentOptions, IntegerOptionDefinition, IntegerOptionOptions, MemberArgumentDefinition, MemberArgumentOptions, MemberOptionDefinition, MemberOptionOptions, NumberArgumentDefinition, NumberArgumentOptions, NumberOptionDefinition, NumberOptionOptions, RoleArgumentDefinition, RoleArgumentOptions, RoleOptionDefinition, RoleOptionOptions, ScalarValueDefinition, StringArgumentDefinition, StringArgumentOptions, StringOptionDefinition, StringOptionOptions, TimeArgumentDefinition, TimeArgumentOptions, TimeOptionDefinition, TimeOptionOptions, TimezoneArgumentDefinition, TimezoneArgumentOptions, TimezoneOptionDefinition, TimezoneOptionOptions, UnionArgumentDefinition, UnionArgumentOptions, UnionOptionDefinition, UnionOptionOptions, UrlArgumentDefinition, UrlArgumentOptions, UrlOptionDefinition, UrlOptionOptions, UserArgumentDefinition, UserArgumentOptions, UserOptionDefinition, UserOptionOptions } from "./types";
/**
 * Factory for positional command arguments.
 *
 * Positional placement only affects message commands. Discord application
 * command options are always named.
 */
export declare const argument: {
    /** Constructs a positional string argument. */
    string<const Required extends boolean = false, const Choices extends ArgumentChoices<string> | undefined = undefined>(options: StringArgumentOptions<Required, Choices>): StringArgumentDefinition<Required, InferArgumentChoiceValue<Choices, string>>;
    /** Constructs a positional integer argument. */
    integer<const Required extends boolean = false, const Choices extends ArgumentChoices<number> | undefined = undefined>(options: IntegerArgumentOptions<Required, Choices>): IntegerArgumentDefinition<Required, InferArgumentChoiceValue<Choices, number>>;
    /** Constructs a positional number argument. */
    number<const Required extends boolean = false, const Choices extends ArgumentChoices<number> | undefined = undefined>(options: NumberArgumentOptions<Required, Choices>): NumberArgumentDefinition<Required, InferArgumentChoiceValue<Choices, number>>;
    /** Constructs a positional boolean argument. */
    boolean<const Required extends boolean = false>(options: BooleanArgumentOptions<Required>): BooleanArgumentDefinition<Required>;
    /** Constructs a positional Discord user argument. */
    user<const Required extends boolean = false>(options: UserArgumentOptions<Required>): UserArgumentDefinition<Required>;
    /** Constructs a positional Discord guild-member argument. */
    member<const Required extends boolean = false>(options: MemberArgumentOptions<Required>): MemberArgumentDefinition<Required>;
    /** Constructs a positional Discord role argument. */
    role<const Required extends boolean = false>(options: RoleArgumentOptions<Required>): RoleArgumentDefinition<Required>;
    /** Constructs a positional URL argument. */
    url<const Required extends boolean = false>(options: UrlArgumentOptions<Required>): UrlArgumentDefinition<Required>;
    /** Constructs a positional timezone argument. */
    timezone<const Required extends boolean = false>(options: TimezoneArgumentOptions<Required>): TimezoneArgumentDefinition<Required>;
    /** Constructs a positional natural-language time argument. */
    time<const Required extends boolean = false>(options: TimeArgumentOptions<Required>): TimeArgumentDefinition<Required>;
    /**
     * Constructs a positional union argument.
     *
     * Message commands try variants in declaration order.
     */
    union<const Required extends boolean = false, const Variants extends readonly ScalarValueDefinition[] = readonly ScalarValueDefinition[]>(options: UnionArgumentOptions<Required, Variants>): UnionArgumentDefinition<Required, Variants>;
};
/**
 * Factory for named message-command options.
 *
 * Named options support the preferred `name:value` syntax and GNU-style
 * `--name value`, `--name=value`, and short aliases.
 */
export declare const option: {
    /** Constructs a named string option. */
    string<const Required extends boolean = false, const Choices extends ArgumentChoices<string> | undefined = undefined>(options: StringOptionOptions<Required, Choices>): StringOptionDefinition<Required, InferArgumentChoiceValue<Choices, string>>;
    /** Constructs a named integer option. */
    integer<const Required extends boolean = false, const Choices extends ArgumentChoices<number> | undefined = undefined>(options: IntegerOptionOptions<Required, Choices>): IntegerOptionDefinition<Required, InferArgumentChoiceValue<Choices, number>>;
    /** Constructs a named number option. */
    number<const Required extends boolean = false, const Choices extends ArgumentChoices<number> | undefined = undefined>(options: NumberOptionOptions<Required, Choices>): NumberOptionDefinition<Required, InferArgumentChoiceValue<Choices, number>>;
    /** Constructs a named boolean option. */
    boolean<const Required extends boolean = false>(options: BooleanOptionOptions<Required>): BooleanOptionDefinition<Required>;
    /** Constructs a named Discord user option. */
    user<const Required extends boolean = false>(options: UserOptionOptions<Required>): UserOptionDefinition<Required>;
    /** Constructs a named Discord guild-member option. */
    member<const Required extends boolean = false>(options: MemberOptionOptions<Required>): MemberOptionDefinition<Required>;
    /** Constructs a named Discord role option. */
    role<const Required extends boolean = false>(options: RoleOptionOptions<Required>): RoleOptionDefinition<Required>;
    /** Constructs a named URL option. */
    url<const Required extends boolean = false>(options: UrlOptionOptions<Required>): UrlOptionDefinition<Required>;
    /** Constructs a named timezone option. */
    timezone<const Required extends boolean = false>(options: TimezoneOptionOptions<Required>): TimezoneOptionDefinition<Required>;
    /** Constructs a named natural-language time option. */
    time<const Required extends boolean = false>(options: TimeOptionOptions<Required>): TimeOptionDefinition<Required>;
    /**
     * Constructs a named union option.
     *
     * Message commands try variants in declaration order.
     */
    union<const Required extends boolean = false, const Variants extends readonly ScalarValueDefinition[] = readonly ScalarValueDefinition[]>(options: UnionOptionOptions<Required, Variants>): UnionOptionDefinition<Required, Variants>;
};
//# sourceMappingURL=builder.d.ts.map