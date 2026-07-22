import type { APISectionComponent, JSONEncodable } from "discord.js";
import {
    type ButtonBuilder,
    SectionBuilder,
    type ThumbnailBuilder,
} from "discord.js";
import { type BuilderConfigurer, configureBuilder } from "./internal";
import {
    type ButtonOptions,
    button as createButton,
    linkButton as createLinkButton,
    premiumButton as createPremiumButton,
    text as createText,
    thumbnail as createThumbnail,
    type LinkButtonOptions,
    type PremiumButtonOptions,
    type TextDisplayInput,
    type ThumbnailInput,
    type ThumbnailOptions,
} from "./primitives";

export type SectionSource =
    | SectionBuilder
    | Partial<APISectionComponent>
    | BuilderConfigurer<V2SectionBuilder>;

/**
 * Fluent wrapper around Discord.js SectionBuilder.
 *
 * A valid section must contain between one and three text displays and must
 * have either a button or thumbnail accessory. Discord.js validates those
 * constraints during serialization.
 */
export class V2SectionBuilder implements JSONEncodable<APISectionComponent> {
    private readonly builder: SectionBuilder;

    public constructor(
        source: SectionBuilder | Partial<APISectionComponent> = {},
    ) {
        this.builder =
            source instanceof SectionBuilder
                ? source
                : new SectionBuilder(source);
    }

    /** Number of text displays currently contained by the section. */
    public get textCount(): number {
        return this.builder.components.length;
    }

    /** Adds one or more text displays. */
    public text(...inputs: TextDisplayInput[]): this {
        this.builder.addTextDisplayComponents(
            ...inputs.map((input) => createText(input)),
        );

        return this;
    }

    /** Sets an interactive custom-ID button as the section accessory. */
    public button(input: ButtonBuilder | ButtonOptions): this {
        this.builder.setButtonAccessory(createButton(input));
        return this;
    }

    /** Sets a link button as the section accessory. */
    public linkButton(input: ButtonBuilder | LinkButtonOptions): this {
        this.builder.setButtonAccessory(createLinkButton(input));
        return this;
    }

    /** Sets a premium SKU button as the section accessory. */
    public premiumButton(input: ButtonBuilder | PremiumButtonOptions): this {
        this.builder.setButtonAccessory(createPremiumButton(input));

        return this;
    }

    /** Sets a thumbnail as the section accessory. */
    public thumbnail(
        input: ThumbnailInput,
        options: ThumbnailOptions = {},
    ): this {
        const accessory: ThumbnailBuilder = createThumbnail(input, options);

        this.builder.setThumbnailAccessory(accessory);
        return this;
    }

    /**
     * Removes, replaces, or inserts section text displays.
     *
     * This follows Array.prototype.splice semantics.
     */
    public spliceText(
        index: number,
        deleteCount: number,
        ...inputs: TextDisplayInput[]
    ): this {
        this.builder.spliceTextDisplayComponents(
            index,
            deleteCount,
            ...inputs.map((input) => createText(input)),
        );

        return this;
    }

    /** Sets the numeric component identifier. */
    public id(id: number): this {
        this.builder.setId(id);
        return this;
    }

    /** Removes the numeric component identifier. */
    public clearId(): this {
        this.builder.clearId();
        return this;
    }

    /** Returns the underlying mutable Discord.js builder. */
    public toBuilder(): SectionBuilder {
        return this.builder;
    }

    /** Serializes the section into Discord API-compatible JSON. */
    public toJSON(): APISectionComponent {
        return this.builder.toJSON();
    }
}

/**
 * Creates a Components V2 section.
 */
export function section(source?: SectionSource): V2SectionBuilder {
    if (source instanceof SectionBuilder) {
        return new V2SectionBuilder(source);
    }

    if (typeof source === "function") {
        return configureBuilder(new V2SectionBuilder(), source);
    }

    return new V2SectionBuilder(source);
}
