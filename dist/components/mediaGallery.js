import { MediaGalleryBuilder } from "discord.js";
import { configureBuilder } from "./internal";
import { mediaGalleryItem } from "./primitives";
/**
 * Fluent wrapper around Discord.js MediaGalleryBuilder.
 */
export class V2MediaGalleryBuilder {
    builder;
    constructor(source = {}) {
        this.builder =
            source instanceof MediaGalleryBuilder
                ? source
                : new MediaGalleryBuilder(source);
    }
    /** Number of media items currently contained by the gallery. */
    get itemCount() {
        return this.builder.items.length;
    }
    /** Adds one media item. */
    item(input) {
        this.builder.addItems(mediaGalleryItem(input));
        return this;
    }
    /** Adds several media items in order. */
    items(...inputs) {
        this.builder.addItems(...inputs.map((input) => mediaGalleryItem(input)));
        return this;
    }
    /**
     * Removes, replaces, or inserts media items.
     *
     * This follows Array.prototype.splice semantics.
     */
    splice(index, deleteCount, ...inputs) {
        const items = inputs.map((input) => mediaGalleryItem(input));
        this.builder.spliceItems(index, deleteCount, ...items);
        return this;
    }
    /** Sets the numeric component identifier. */
    id(id) {
        this.builder.setId(id);
        return this;
    }
    /** Removes the numeric component identifier. */
    clearId() {
        this.builder.clearId();
        return this;
    }
    /** Returns the underlying mutable Discord.js builder. */
    toBuilder() {
        return this.builder;
    }
    /** Serializes the gallery into Discord API-compatible JSON. */
    toJSON() {
        return this.builder.toJSON();
    }
}
/**
 * Creates a Components V2 media gallery.
 */
export function mediaGallery(source) {
    if (source instanceof MediaGalleryBuilder) {
        return new V2MediaGalleryBuilder(source);
    }
    if (typeof source === "function") {
        return configureBuilder(new V2MediaGalleryBuilder(), source);
    }
    return new V2MediaGalleryBuilder(source);
}
//# sourceMappingURL=mediaGallery.js.map