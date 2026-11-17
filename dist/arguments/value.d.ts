import type { ArgumentChoices, ArgumentValueDefinition, BooleanValueDefinition, InferArgumentChoiceValue, IntegerValueDefinition, IntegerValueOptions, MemberValueDefinition, NumberValueDefinition, NumberValueOptions, RoleValueDefinition, RoleValueOptions, ScalarValueDefinition, StringValueDefinition, StringValueOptions, TimeValueDefinition, TimeValueOptions, TimezoneValueDefinition, UnionValueDefinition, UnionValueOptions, UrlValueDefinition, UrlValueOptions, UserValueDefinition } from "./types";
/**
 * Factory for constructing semantic command values independently from their
 * message-command placement.
 */
export declare const value: {
    /**
     * Constructs a string value.
     */
    string<const Choices extends ArgumentChoices<string> | undefined = undefined>(options?: StringValueOptions<Choices>): StringValueDefinition<InferArgumentChoiceValue<Choices, string>>;
    /**
     * Constructs an integer value.
     */
    integer<const Choices extends ArgumentChoices<number> | undefined = undefined>(options?: IntegerValueOptions<Choices>): IntegerValueDefinition<InferArgumentChoiceValue<Choices, number>>;
    /**
     * Constructs a floating-point number value.
     */
    number<const Choices extends ArgumentChoices<number> | undefined = undefined>(options?: NumberValueOptions<Choices>): NumberValueDefinition<InferArgumentChoiceValue<Choices, number>>;
    /**
     * Constructs a boolean value.
     */
    boolean(): BooleanValueDefinition;
    /**
     * Constructs a Discord user value.
     */
    user(): UserValueDefinition;
    /**
     * Constructs a Discord guild-member value.
     */
    member(): MemberValueDefinition;
    /**
     * Constructs a Discord role value.
     */
    role(options?: RoleValueOptions): RoleValueDefinition;
    /**
     * Constructs a URL value.
     */
    url(options?: UrlValueOptions): UrlValueDefinition;
    /**
     * Constructs an IANA timezone value.
     */
    timezone(): TimezoneValueDefinition;
    /**
     * Constructs a natural-language date/time value.
     */
    time(options?: TimeValueOptions): TimeValueDefinition;
    /**
     * Constructs a semantic union.
     *
     * Prefix commands try variants in declaration order.
     */
    union<const Variants extends readonly ScalarValueDefinition[]>(variants: Variants, options?: UnionValueOptions): UnionValueDefinition<Variants>;
};
/**
 * Returns the scalar representation used by Discord for a semantic value.
 */
export declare function getSlashValueDefinition(definition: ArgumentValueDefinition): ScalarValueDefinition;
/**
 * Returns whether a message-command value may be represented as a bare Lexure
 * flag.
 *
 * Heterogeneous unions require explicit values. A union is flag-compatible
 * only when every possible variant is boolean.
 */
export declare function isMessageFlagValueDefinition(definition: ArgumentValueDefinition): boolean;
/**
 * Returns whether Discord supports autocomplete for this scalar type.
 */
export declare function isAutocompletableValueDefinition(definition: ScalarValueDefinition): boolean;
/**
 * Returns a concise human-readable value type for usage and error messages.
 */
export declare function describeValueDefinition(definition: ArgumentValueDefinition): string;
//# sourceMappingURL=value.d.ts.map