import type { APIMediaGalleryComponent, JSONEncodable } from "discord.js";
import { MediaGalleryBuilder, type MediaGalleryItemBuilder } from "discord.js";
import { type BuilderConfigurer, configureBuilder } from "./internal";
import { type MediaGalleryItemInput, mediaGalleryItem } from "./primitives";

export type MediaGallerySource =
    | MediaGalleryBuilder
    | Partial<APIMediaGalleryComponent>
    | BuilderConfigurer<V2MediaGalleryBuilder>;

/**
 * Fluent wrapper around Discord.js MediaGalleryBuilder.
 */
export class V2MediaGalleryBuilder implements JSONEncodable<APIMediaGalleryComponent> {
    private readonly builder: MediaGalleryBuilder;

    public constructor(
        source: MediaGalleryBuilder | Partial<APIMediaGalleryComponent> = {},
    ) {
        this.builder =
            source instanceof MediaGalleryBuilder
                ? source
                : new MediaGalleryBuilder(source);
    }

    /** Number of media items currently contained by the gallery. */
    public get itemCount(): number {
        return this.builder.items.length;
    }

    /** Adds one media item. */
    public item(input: MediaGalleryItemInput): this {
        this.builder.addItems(mediaGalleryItem(input));
        return this;
    }

    /** Adds several media items in order. */
    public items(...inputs: MediaGalleryItemInput[]): this {
        this.builder.addItems(
            ...inputs.map((input) => mediaGalleryItem(input)),
        );

        return this;
    }

    /**
     * Removes, replaces, or inserts media items.
     *
     * This follows Array.prototype.splice semantics.
     */
    public splice(
        index: number,
        deleteCount: number,
        ...inputs: MediaGalleryItemInput[]
    ): this {
        const items: MediaGalleryItemBuilder[] = inputs.map((input) =>
            mediaGalleryItem(input),
        );

        this.builder.spliceItems(index, deleteCount, ...items);
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
    public toBuilder(): MediaGalleryBuilder {
        return this.builder;
    }

    /** Serializes the gallery into Discord API-compatible JSON. */
    public toJSON(): APIMediaGalleryComponent {
        return this.builder.toJSON();
    }
}

/**
 * Creates a Components V2 media gallery.
 */
export function mediaGallery(
    source?: MediaGallerySource,
): V2MediaGalleryBuilder {
    if (source instanceof MediaGalleryBuilder) {
        return new V2MediaGalleryBuilder(source);
    }

    if (typeof source === "function") {
        return configureBuilder(new V2MediaGalleryBuilder(), source);
    }

    return new V2MediaGalleryBuilder(source);
}
