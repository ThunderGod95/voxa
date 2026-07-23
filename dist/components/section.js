import { SectionBuilder, } from "discord.js";
import { configureBuilder } from "./internal";
import { button as createButton, linkButton as createLinkButton, premiumButton as createPremiumButton, text as createText, thumbnail as createThumbnail, } from "./primitives";
/**
 * Fluent wrapper around Discord.js SectionBuilder.
 *
 * A valid section must contain between one and three text displays and must
 * have either a button or thumbnail accessory. Discord.js validates those
 * constraints during serialization.
 */
export class V2SectionBuilder {
    builder;
    constructor(source = {}) {
        this.builder =
            source instanceof SectionBuilder
                ? source
                : new SectionBuilder(source);
    }
    /** Number of text displays currently contained by the section. */
    get textCount() {
        return this.builder.components.length;
    }
    /** Adds one or more text displays. */
    text(...inputs) {
        this.builder.addTextDisplayComponents(...inputs.map((input) => createText(input)));
        return this;
    }
    /** Sets an interactive custom-ID button as the section accessory. */
    button(input) {
        this.builder.setButtonAccessory(createButton(input));
        return this;
    }
    /** Sets a link button as the section accessory. */
    linkButton(input) {
        this.builder.setButtonAccessory(createLinkButton(input));
        return this;
    }
    /** Sets a premium SKU button as the section accessory. */
    premiumButton(input) {
        this.builder.setButtonAccessory(createPremiumButton(input));
        return this;
    }
    /** Sets a thumbnail as the section accessory. */
    thumbnail(input, options = {}) {
        const accessory = createThumbnail(input, options);
        this.builder.setThumbnailAccessory(accessory);
        return this;
    }
    /**
     * Removes, replaces, or inserts section text displays.
     *
     * This follows Array.prototype.splice semantics.
     */
    spliceText(index, deleteCount, ...inputs) {
        this.builder.spliceTextDisplayComponents(index, deleteCount, ...inputs.map((input) => createText(input)));
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
    /** Serializes the section into Discord API-compatible JSON. */
    toJSON() {
        return this.builder.toJSON();
    }
}
/**
 * Creates a Components V2 section.
 */
export function section(source) {
    if (source instanceof SectionBuilder) {
        return new V2SectionBuilder(source);
    }
    if (typeof source === "function") {
        return configureBuilder(new V2SectionBuilder(), source);
    }
    return new V2SectionBuilder(source);
}
//# sourceMappingURL=section.js.map