import type { APIMediaGalleryComponent, JSONEncodable } from "discord.js";
import { MediaGalleryBuilder } from "discord.js";
import { type BuilderConfigurer } from "./internal";
import { type MediaGalleryItemInput } from "./primitives";
export type MediaGallerySource = MediaGalleryBuilder | Partial<APIMediaGalleryComponent> | BuilderConfigurer<V2MediaGalleryBuilder>;
/**
 * Fluent wrapper around Discord.js MediaGalleryBuilder.
 */
export declare class V2MediaGalleryBuilder implements JSONEncodable<APIMediaGalleryComponent> {
    private readonly builder;
    constructor(source?: MediaGalleryBuilder | Partial<APIMediaGalleryComponent>);
    /** Number of media items currently contained by the gallery. */
    get itemCount(): number;
    /** Adds one media item. */
    item(input: MediaGalleryItemInput): this;
    /** Adds several media items in order. */
    items(...inputs: MediaGalleryItemInput[]): this;
    /**
     * Removes, replaces, or inserts media items.
     *
     * This follows Array.prototype.splice semantics.
     */
    splice(index: number, deleteCount: number, ...inputs: MediaGalleryItemInput[]): this;
    /** Sets the numeric component identifier. */
    id(id: number): this;
    /** Removes the numeric component identifier. */
    clearId(): this;
    /** Returns the underlying mutable Discord.js builder. */
    toBuilder(): MediaGalleryBuilder;
    /** Serializes the gallery into Discord API-compatible JSON. */
    toJSON(): APIMediaGalleryComponent;
}
/**
 * Creates a Components V2 media gallery.
 */
export declare function mediaGallery(source?: MediaGallerySource): V2MediaGalleryBuilder;
//# sourceMappingURL=mediaGallery.d.ts.map