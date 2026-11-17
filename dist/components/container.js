import { ContainerBuilder, } from "discord.js";
import { actionRow as createActionRow, V2ActionRowBuilder, } from "./actionRow";
import { configureBuilder } from "./internal";
import { mediaGallery as createMediaGallery, V2MediaGalleryBuilder, } from "./mediaGallery";
import { file as createFile, separator as createSeparator, text as createText, } from "./primitives";
import { section as createSection, V2SectionBuilder, } from "./section";
function resolveContainerComponent(component) {
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
export class V2ContainerBuilder {
    builder;
    constructor(source = {}) {
        this.builder =
            source instanceof ContainerBuilder
                ? source
                : new ContainerBuilder(source);
    }
    /** Number of direct children currently contained by the container. */
    get componentCount() {
        return this.builder.components.length;
    }
    /**
     * Adds raw Discord API components, Discord.js builders, or Voxa wrappers.
     *
     * This is the escape hatch for advanced or newly introduced component
     * functionality.
     */
    add(...components) {
        const startIndex = this.builder.components.length;
        this.builder.spliceComponents(startIndex, 0, ...components.map(resolveContainerComponent));
        return this;
    }
    /** Adds one or more text displays. */
    text(...inputs) {
        this.builder.addTextDisplayComponents(...inputs.map((input) => createText(input)));
        return this;
    }
    /** Adds a separator. */
    separator(input = {}) {
        this.builder.addSeparatorComponents(createSeparator(input));
        return this;
    }
    /**
     * Adds a file component referencing an uploaded attachment.
     *
     * String inputs are automatically converted to
     * `attachment://<filename>`.
     */
    file(input, options = {}) {
        this.builder.addFileComponents(createFile(input, options));
        return this;
    }
    /** Adds a section. */
    section(source) {
        const child = createSection(source);
        this.builder.addSectionComponents(child.toBuilder());
        return this;
    }
    /** Adds a media gallery. */
    mediaGallery(source) {
        const child = createMediaGallery(source);
        this.builder.addMediaGalleryComponents(child.toBuilder());
        return this;
    }
    /** Adds an action row. */
    actionRow(source) {
        const child = createActionRow(source);
        this.builder.addActionRowComponents(child.toBuilder());
        return this;
    }
    /**
     * Removes, replaces, or inserts direct container children.
     *
     * This follows Array.prototype.splice semantics.
     */
    splice(index, deleteCount, ...components) {
        this.builder.spliceComponents(index, deleteCount, ...components.map(resolveContainerComponent));
        return this;
    }
    /** Sets the container accent color. */
    accentColor(color) {
        this.builder.setAccentColor(color);
        return this;
    }
    /** Removes the container accent color. */
    clearAccentColor() {
        this.builder.clearAccentColor();
        return this;
    }
    /** Sets whether the entire container is hidden behind a spoiler. */
    spoiler(enabled = true) {
        this.builder.setSpoiler(enabled);
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
    /** Returns the underlying mutable Discord.js ContainerBuilder. */
    toBuilder() {
        return this.builder;
    }
    /** Serializes the container into Discord API-compatible JSON. */
    toJSON() {
        return this.builder.toJSON();
    }
}
/**
 * Creates a Components V2 container.
 */
export function container(source) {
    if (source instanceof ContainerBuilder) {
        return new V2ContainerBuilder(source);
    }
    if (typeof source === "function") {
        return configureBuilder(new V2ContainerBuilder(), source);
    }
    return new V2ContainerBuilder(source);
}
//# sourceMappingURL=container.js.map