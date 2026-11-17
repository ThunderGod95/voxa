import type { APIComponentInContainer, APIContainerComponent, JSONEncodable, MessageActionRowComponentBuilder, RGBTuple } from "discord.js";
import { type ActionRowBuilder, ContainerBuilder, type FileBuilder, type MediaGalleryBuilder, type SectionBuilder, type SeparatorBuilder, type TextDisplayBuilder } from "discord.js";
import { type ActionRowSource, V2ActionRowBuilder } from "./actionRow";
import { type BuilderConfigurer } from "./internal";
import { type MediaGallerySource, V2MediaGalleryBuilder } from "./mediaGallery";
import { type FileInput, type FileOptions, type SeparatorInput, type TextDisplayInput } from "./primitives";
import { type SectionSource, V2SectionBuilder } from "./section";
export type RawContainerComponentBuilder = ActionRowBuilder<MessageActionRowComponentBuilder> | FileBuilder | MediaGalleryBuilder | SectionBuilder | SeparatorBuilder | TextDisplayBuilder;
export type ContainerComponentInput = APIComponentInContainer | RawContainerComponentBuilder | V2ActionRowBuilder | V2MediaGalleryBuilder | V2SectionBuilder;
export type ContainerSource = ContainerBuilder | Partial<APIContainerComponent> | BuilderConfigurer<V2ContainerBuilder>;
/**
 * High-level Components V2 container builder.
 *
 * The wrapper is directly serializable and can be supplied to Discord.js in
 * a message's `components` array without calling `toBuilder()` or `toJSON()`.
 */
export declare class V2ContainerBuilder implements JSONEncodable<APIContainerComponent> {
    private readonly builder;
    constructor(source?: ContainerBuilder | Partial<APIContainerComponent>);
    /** Number of direct children currently contained by the container. */
    get componentCount(): number;
    /**
     * Adds raw Discord API components, Discord.js builders, or Voxa wrappers.
     *
     * This is the escape hatch for advanced or newly introduced component
     * functionality.
     */
    add(...components: ContainerComponentInput[]): this;
    /** Adds one or more text displays. */
    text(...inputs: TextDisplayInput[]): this;
    /** Adds a separator. */
    separator(input?: SeparatorInput): this;
    /**
     * Adds a file component referencing an uploaded attachment.
     *
     * String inputs are automatically converted to
     * `attachment://<filename>`.
     */
    file(input: FileInput, options?: FileOptions): this;
    /** Adds a section. */
    section(source?: SectionSource): this;
    /** Adds a media gallery. */
    mediaGallery(source?: MediaGallerySource): this;
    /** Adds an action row. */
    actionRow(source?: ActionRowSource): this;
    /**
     * Removes, replaces, or inserts direct container children.
     *
     * This follows Array.prototype.splice semantics.
     */
    splice(index: number, deleteCount: number, ...components: ContainerComponentInput[]): this;
    /** Sets the container accent color. */
    accentColor(color: number | RGBTuple): this;
    /** Removes the container accent color. */
    clearAccentColor(): this;
    /** Sets whether the entire container is hidden behind a spoiler. */
    spoiler(enabled?: boolean): this;
    /** Sets the numeric component identifier. */
    id(id: number): this;
    /** Removes the numeric component identifier. */
    clearId(): this;
    /** Returns the underlying mutable Discord.js ContainerBuilder. */
    toBuilder(): ContainerBuilder;
    /** Serializes the container into Discord API-compatible JSON. */
    toJSON(): APIContainerComponent;
}
/**
 * Creates a Components V2 container.
 */
export declare function container(source?: ContainerSource): V2ContainerBuilder;
//# sourceMappingURL=container.d.ts.map