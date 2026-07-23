import type { BooleanArgumentDefinition, BooleanArgumentOptions, IntegerArgumentDefinition, IntegerArgumentOptions, MemberArgumentDefinition, MemberArgumentOptions, NumberArgumentDefinition, NumberArgumentOptions, RoleArgumentDefinition, RoleArgumentOptions, StringArgumentDefinition, StringArgumentOptions, TimeArgumentDefinition, TimeArgumentOptions, TimezoneArgumentDefinition, TimezoneArgumentOptions, UrlArgumentDefinition, UrlArgumentOptions, UserArgumentDefinition, UserArgumentOptions } from "./types";
/**
 * Factory object for creating strongly-typed command argument definitions.
 */
export declare const argument: {
    /** Constructs a string argument definition. */
    string<const Required extends boolean = false>(options: StringArgumentOptions<Required>): StringArgumentDefinition<Required>;
    /** Constructs an integer argument definition. Input is coerced automatically. */
    integer<const Required extends boolean = false>(options: IntegerArgumentOptions<Required>): IntegerArgumentDefinition<Required>;
    /** Constructs a floating-point number argument definition. */
    number<const Required extends boolean = false>(options: NumberArgumentOptions<Required>): NumberArgumentDefinition<Required>;
    /** Constructs a boolean argument. Accepts various truthy/falsy string representations. */
    boolean<const Required extends boolean = false>(options: BooleanArgumentOptions<Required>): BooleanArgumentDefinition<Required>;
    /** Constructs a Discord User argument definition. */
    user<const Required extends boolean = false>(options: UserArgumentOptions<Required>): UserArgumentDefinition<Required>;
    /** Constructs a Discord GuildMember argument definition. */
    member<const Required extends boolean = false>(options: MemberArgumentOptions<Required>): MemberArgumentDefinition<Required>;
    /** Constructs a Discord Role argument definition. */
    role<const Required extends boolean = false>(options: RoleArgumentOptions<Required>): RoleArgumentDefinition<Required>;
    url<const Required extends boolean = false>(options: UrlArgumentOptions<Required>): UrlArgumentDefinition<Required>;
    /** Constructs an IANA timezone argument from names, cities, or safe aliases. */
    timezone<const Required extends boolean = false>(options: TimezoneArgumentOptions<Required>): TimezoneArgumentDefinition<Required>;
    /** Constructs a natural-language date/time argument parsed by Chrono. */
    time<const Required extends boolean = false>(options: TimeArgumentOptions<Required>): TimeArgumentDefinition<Required>;
};
//# sourceMappingURL=builder.d.ts.map