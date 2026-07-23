import type { ButtonBuilder, JSONEncodable, MessageActionRowComponentBuilder } from "discord.js";
import { ActionRowBuilder, ChannelSelectMenuBuilder, MentionableSelectMenuBuilder, RoleSelectMenuBuilder, StringSelectMenuBuilder, UserSelectMenuBuilder } from "discord.js";
import { type BuilderConfigurer } from "./internal";
import { type ButtonOptions, type LinkButtonOptions, type PremiumButtonOptions } from "./primitives";
export type MessageActionRowBuilder = ActionRowBuilder<MessageActionRowComponentBuilder>;
type ActionRowJSON = ReturnType<MessageActionRowBuilder["toJSON"]>;
export type ActionRowSource = MessageActionRowBuilder | BuilderConfigurer<V2ActionRowBuilder>;
/**
 * Fluent wrapper around Discord.js ActionRowBuilder.
 *
 * It provides concise factories for common row components while preserving
 * access to the complete Discord.js builders through callbacks and `add`.
 */
export declare class V2ActionRowBuilder implements JSONEncodable<ActionRowJSON> {
    private readonly builder;
    constructor(builder?: MessageActionRowBuilder);
    /** Number of components currently contained by this row. */
    get componentCount(): number;
    /**
     * Adds already constructed Discord.js message components.
     *
     * This is the escape hatch for component types not covered by the
     * convenience methods.
     */
    add(...components: MessageActionRowComponentBuilder[]): this;
    /** Adds an interactive custom-ID button. */
    button(input: ButtonBuilder | ButtonOptions): this;
    /** Adds a URL button. */
    linkButton(input: ButtonBuilder | LinkButtonOptions): this;
    /** Adds a premium SKU button. */
    premiumButton(input: ButtonBuilder | PremiumButtonOptions): this;
    /** Adds a string select menu. */
    stringSelect(input: StringSelectMenuBuilder | BuilderConfigurer<StringSelectMenuBuilder>): this;
    /** Adds a user select menu. */
    userSelect(input: UserSelectMenuBuilder | BuilderConfigurer<UserSelectMenuBuilder>): this;
    /** Adds a role select menu. */
    roleSelect(input: RoleSelectMenuBuilder | BuilderConfigurer<RoleSelectMenuBuilder>): this;
    /** Adds a mentionable select menu. */
    mentionableSelect(input: MentionableSelectMenuBuilder | BuilderConfigurer<MentionableSelectMenuBuilder>): this;
    /** Adds a channel select menu. */
    channelSelect(input: ChannelSelectMenuBuilder | BuilderConfigurer<ChannelSelectMenuBuilder>): this;
    /**
     * Removes, replaces, or inserts row components.
     *
     * This follows Array.prototype.splice semantics.
     */
    splice(index: number, deleteCount: number, ...components: MessageActionRowComponentBuilder[]): this;
    /** Returns the underlying mutable Discord.js builder. */
    toBuilder(): MessageActionRowBuilder;
    /** Serializes the row into Discord API-compatible JSON. */
    toJSON(): ActionRowJSON;
}
/**
 * Creates a Components V2 action row.
 */
export declare function actionRow(source?: ActionRowSource): V2ActionRowBuilder;
export {};
//# sourceMappingURL=actionRow.d.ts.map