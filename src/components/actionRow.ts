import type {
    ButtonBuilder,
    JSONEncodable,
    MessageActionRowComponentBuilder,
} from "discord.js";
import { ActionRowBuilder } from "discord.js";
import {
    type ChannelSelectInput,
    channelSelect as createChannelSelect,
    mentionableSelect as createMentionableSelect,
    roleSelect as createRoleSelect,
    stringSelect as createStringSelect,
    userSelect as createUserSelect,
    type MentionableSelectInput,
    type RoleSelectInput,
    type StringSelectInput,
    type UserSelectInput,
} from "./inputs";
import { type BuilderConfigurer, configureBuilder } from "./internal";
import {
    type ButtonOptions,
    button as createButton,
    linkButton as createLinkButton,
    premiumButton as createPremiumButton,
    type LinkButtonOptions,
    type PremiumButtonOptions,
} from "./primitives";

export type MessageActionRowBuilder =
    ActionRowBuilder<MessageActionRowComponentBuilder>;

type ActionRowJSON = ReturnType<MessageActionRowBuilder["toJSON"]>;

export type ActionRowSource =
    MessageActionRowBuilder | BuilderConfigurer<V2ActionRowBuilder>;

/**
 * Fluent wrapper around Discord.js ActionRowBuilder.
 *
 * It provides concise factories for common row components while preserving
 * access to the complete Discord.js builders through callbacks and `add`.
 */
export class V2ActionRowBuilder implements JSONEncodable<ActionRowJSON> {
    private readonly builder: MessageActionRowBuilder;

    public constructor(builder?: MessageActionRowBuilder) {
        this.builder =
            builder ?? new ActionRowBuilder<MessageActionRowComponentBuilder>();
    }

    /** Number of components currently contained by this row. */
    public get componentCount(): number {
        return this.builder.components.length;
    }

    /**
     * Adds already constructed Discord.js message components.
     *
     * This is the escape hatch for component types not covered by the
     * convenience methods.
     */
    public add(...components: MessageActionRowComponentBuilder[]): this {
        this.builder.addComponents(...components);
        return this;
    }

    /** Adds an interactive custom-ID button. */
    public button(input: ButtonBuilder | ButtonOptions): this {
        this.builder.addComponents(createButton(input));
        return this;
    }

    /** Adds a URL button. */
    public linkButton(input: ButtonBuilder | LinkButtonOptions): this {
        this.builder.addComponents(createLinkButton(input));
        return this;
    }

    /** Adds a premium SKU button. */
    public premiumButton(input: ButtonBuilder | PremiumButtonOptions): this {
        this.builder.addComponents(createPremiumButton(input));
        return this;
    }

    /** Adds a string select menu. */
    public stringSelect(input: StringSelectInput): this {
        this.builder.addComponents(createStringSelect(input));
        return this;
    }

    /** Adds a user select menu. */
    public userSelect(input: UserSelectInput): this {
        this.builder.addComponents(createUserSelect(input));
        return this;
    }

    /** Adds a role select menu. */
    public roleSelect(input: RoleSelectInput): this {
        this.builder.addComponents(createRoleSelect(input));
        return this;
    }

    /** Adds a mentionable select menu. */
    public mentionableSelect(input: MentionableSelectInput): this {
        this.builder.addComponents(createMentionableSelect(input));
        return this;
    }

    /** Adds a channel select menu. */
    public channelSelect(input: ChannelSelectInput): this {
        this.builder.addComponents(createChannelSelect(input));
        return this;
    }

    /**
     * Removes, replaces, or inserts row components.
     *
     * This follows Array.prototype.splice semantics.
     */
    public splice(
        index: number,
        deleteCount: number,
        ...components: MessageActionRowComponentBuilder[]
    ): this {
        const updatedComponents = [...this.builder.components];

        updatedComponents.splice(index, deleteCount, ...components);

        this.builder.setComponents(...updatedComponents);

        return this;
    }

    /** Returns the underlying mutable Discord.js builder. */
    public toBuilder(): MessageActionRowBuilder {
        return this.builder;
    }

    /** Serializes the row into Discord API-compatible JSON. */
    public toJSON(): ActionRowJSON {
        return this.builder.toJSON();
    }
}

/**
 * Creates a Components V2 action row.
 */
export function actionRow(source?: ActionRowSource): V2ActionRowBuilder {
    if (source instanceof ActionRowBuilder) {
        return new V2ActionRowBuilder(source);
    }

    const row = new V2ActionRowBuilder();

    return source === undefined ? row : configureBuilder(row, source);
}
