import type {
    APIComponentInContainer,
    APIContainerComponent,
    JSONEncodable,
    MessageActionRowComponentBuilder,
    RGBTuple,
} from "discord.js";
import {
    type ActionRowBuilder,
    ContainerBuilder,
    type FileBuilder,
    type MediaGalleryBuilder,
    type SectionBuilder,
    type SeparatorBuilder,
    type TextDisplayBuilder,
} from "discord.js";
import {
    type ActionRowSource,
    actionRow as createActionRow,
    V2ActionRowBuilder,
} from "./actionRow";
import { type BuilderConfigurer, configureBuilder } from "./internal";
import {
    mediaGallery as createMediaGallery,
    type MediaGallerySource,
    V2MediaGalleryBuilder,
} from "./mediaGallery";
import {
    file as createFile,
    separator as createSeparator,
    text as createText,
    type FileInput,
    type FileOptions,
    type SeparatorInput,
    type TextDisplayInput,
} from "./primitives";
import {
    section as createSection,
    type SectionSource,
    V2SectionBuilder,
} from "./section";

export type RawContainerComponentBuilder =
    | ActionRowBuilder<MessageActionRowComponentBuilder>
    | FileBuilder
    | MediaGalleryBuilder
    | SectionBuilder
    | SeparatorBuilder
    | TextDisplayBuilder;

export type ContainerComponentInput =
    | APIComponentInContainer
    | RawContainerComponentBuilder
    | V2ActionRowBuilder
    | V2MediaGalleryBuilder
    | V2SectionBuilder;

export type ContainerSource =
    | ContainerBuilder
    | Partial<APIContainerComponent>
    | BuilderConfigurer<V2ContainerBuilder>;

function resolveContainerComponent(
    component: ContainerComponentInput,
): APIComponentInContainer | RawContainerComponentBuilder {
    if (component instanceof V2ActionRowBuilder) {
        return component.toBuilder();
    }

    if (component instanceof V2MediaGalleryBuilder) {
        return component.toBuilder();
    }

    if (component instanceof V2SectionBuilder) {
        return component.toBuilder();
    }

    return component;
}

/**
 * High-level Components V2 container builder.
 *
 * The wrapper is directly serializable and can be supplied to Discord.js in
 * a message's `components` array without calling `toBuilder()` or `toJSON()`.
 */
export class V2ContainerBuilder implements JSONEncodable<APIContainerComponent> {
    private readonly builder: ContainerBuilder;

    public constructor(
        source: ContainerBuilder | Partial<APIContainerComponent> = {},
    ) {
        this.builder =
            source instanceof ContainerBuilder
                ? source
                : new ContainerBuilder(source);
    }

    /** Number of direct children currently contained by the container. */
    public get componentCount(): number {
        return this.builder.components.length;
    }

    /**
     * Adds raw Discord API components, Discord.js builders, or Voxa wrappers.
     *
     * This is the escape hatch for advanced or newly introduced component
     * functionality.
     */
    public add(...components: ContainerComponentInput[]): this {
        const startIndex = this.builder.components.length;

        this.builder.spliceComponents(
            startIndex,
            0,
            ...components.map(resolveContainerComponent),
        );

        return this;
    }

    /** Adds one or more text displays. */
    public text(...inputs: TextDisplayInput[]): this {
        this.builder.addTextDisplayComponents(
            ...inputs.map((input) => createText(input)),
        );

        return this;
    }

    /** Adds a separator. */
    public separator(input: SeparatorInput = {}): this {
        this.builder.addSeparatorComponents(createSeparator(input));

        return this;
    }

    /**
     * Adds a file component referencing an uploaded attachment.
     *
     * String inputs are automatically converted to
     * `attachment://<filename>`.
     */
    public file(input: FileInput, options: FileOptions = {}): this {
        this.builder.addFileComponents(createFile(input, options));

        return this;
    }

    /** Adds a section. */
    public section(source?: SectionSource): this {
        const child = createSection(source);

        this.builder.addSectionComponents(child.toBuilder());
        return this;
    }

    /** Adds a media gallery. */
    public mediaGallery(source?: MediaGallerySource): this {
        const child = createMediaGallery(source);

        this.builder.addMediaGalleryComponents(child.toBuilder());

        return this;
    }

    /** Adds an action row. */
    public actionRow(source?: ActionRowSource): this {
        const child = createActionRow(source);

        this.builder.addActionRowComponents(child.toBuilder());
        return this;
    }

    /**
     * Removes, replaces, or inserts direct container children.
     *
     * This follows Array.prototype.splice semantics.
     */
    public splice(
        index: number,
        deleteCount: number,
        ...components: ContainerComponentInput[]
    ): this {
        this.builder.spliceComponents(
            index,
            deleteCount,
            ...components.map(resolveContainerComponent),
        );

        return this;
    }

    /** Sets the container accent color. */
    public accentColor(color: number | RGBTuple): this {
        this.builder.setAccentColor(color);
        return this;
    }

    /** Removes the container accent color. */
    public clearAccentColor(): this {
        this.builder.clearAccentColor();
        return this;
    }

    /** Sets whether the entire container is hidden behind a spoiler. */
    public spoiler(enabled = true): this {
        this.builder.setSpoiler(enabled);
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

    /** Returns the underlying mutable Discord.js ContainerBuilder. */
    public toBuilder(): ContainerBuilder {
        return this.builder;
    }

    /** Serializes the container into Discord API-compatible JSON. */
    public toJSON(): APIContainerComponent {
        return this.builder.toJSON();
    }
}

/**
 * Creates a Components V2 container.
 */
export function container(source?: ContainerSource): V2ContainerBuilder {
    if (source instanceof ContainerBuilder) {
        return new V2ContainerBuilder(source);
    }

    if (typeof source === "function") {
        return configureBuilder(new V2ContainerBuilder(), source);
    }

    return new V2ContainerBuilder(source);
}
