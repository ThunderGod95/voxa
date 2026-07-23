import { ActionRowBuilder, ChannelSelectMenuBuilder, MentionableSelectMenuBuilder, RoleSelectMenuBuilder, StringSelectMenuBuilder, UserSelectMenuBuilder, } from "discord.js";
import { configureBuilder } from "./internal";
import { button as createButton, linkButton as createLinkButton, premiumButton as createPremiumButton, } from "./primitives";
/**
 * Fluent wrapper around Discord.js ActionRowBuilder.
 *
 * It provides concise factories for common row components while preserving
 * access to the complete Discord.js builders through callbacks and `add`.
 */
export class V2ActionRowBuilder {
    builder;
    constructor(builder) {
        this.builder =
            builder ?? new ActionRowBuilder();
    }
    /** Number of components currently contained by this row. */
    get componentCount() {
        return this.builder.components.length;
    }
    /**
     * Adds already constructed Discord.js message components.
     *
     * This is the escape hatch for component types not covered by the
     * convenience methods.
     */
    add(...components) {
        this.builder.addComponents(...components);
        return this;
    }
    /** Adds an interactive custom-ID button. */
    button(input) {
        this.builder.addComponents(createButton(input));
        return this;
    }
    /** Adds a URL button. */
    linkButton(input) {
        this.builder.addComponents(createLinkButton(input));
        return this;
    }
    /** Adds a premium SKU button. */
    premiumButton(input) {
        this.builder.addComponents(createPremiumButton(input));
        return this;
    }
    /** Adds a string select menu. */
    stringSelect(input) {
        const component = input instanceof StringSelectMenuBuilder
            ? input
            : configureBuilder(new StringSelectMenuBuilder(), input);
        this.builder.addComponents(component);
        return this;
    }
    /** Adds a user select menu. */
    userSelect(input) {
        const component = input instanceof UserSelectMenuBuilder
            ? input
            : configureBuilder(new UserSelectMenuBuilder(), input);
        this.builder.addComponents(component);
        return this;
    }
    /** Adds a role select menu. */
    roleSelect(input) {
        const component = input instanceof RoleSelectMenuBuilder
            ? input
            : configureBuilder(new RoleSelectMenuBuilder(), input);
        this.builder.addComponents(component);
        return this;
    }
    /** Adds a mentionable select menu. */
    mentionableSelect(input) {
        const component = input instanceof MentionableSelectMenuBuilder
            ? input
            : configureBuilder(new MentionableSelectMenuBuilder(), input);
        this.builder.addComponents(component);
        return this;
    }
    /** Adds a channel select menu. */
    channelSelect(input) {
        const component = input instanceof ChannelSelectMenuBuilder
            ? input
            : configureBuilder(new ChannelSelectMenuBuilder(), input);
        this.builder.addComponents(component);
        return this;
    }
    /**
     * Removes, replaces, or inserts row components.
     *
     * This follows Array.prototype.splice semantics.
     */
    splice(index, deleteCount, ...components) {
        const updatedComponents = [...this.builder.components];
        updatedComponents.splice(index, deleteCount, ...components);
        this.builder.setComponents(...updatedComponents);
        return this;
    }
    /** Returns the underlying mutable Discord.js builder. */
    toBuilder() {
        return this.builder;
    }
    /** Serializes the row into Discord API-compatible JSON. */
    toJSON() {
        return this.builder.toJSON();
    }
}
/**
 * Creates a Components V2 action row.
 */
export function actionRow(source) {
    if (source instanceof ActionRowBuilder) {
        return new V2ActionRowBuilder(source);
    }
    const row = new V2ActionRowBuilder();
    return source === undefined ? row : configureBuilder(row, source);
}
//# sourceMappingURL=actionRow.js.map