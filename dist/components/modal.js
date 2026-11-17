import { ModalBuilder } from "discord.js";
import { configureBuilder } from "./internal";
import { label as createLabel, } from "./label";
import { text as createText } from "./primitives";
/**
 * Fluent wrapper around Discord.js ModalBuilder.
 *
 * Labels are used for interactive modal inputs. Text displays may be added
 * directly to the modal for non-interactive content.
 */
export class V2ModalBuilder {
    builder;
    constructor(source = {}) {
        this.builder =
            source instanceof ModalBuilder ? source : new ModalBuilder(source);
    }
    /** Number of direct components currently contained by the modal. */
    get componentCount() {
        return this.builder.components.length;
    }
    /** Sets the identifier returned when the modal is submitted. */
    customId(customId) {
        this.builder.setCustomId(customId);
        return this;
    }
    /** Sets the modal title. */
    title(title) {
        this.builder.setTitle(title);
        return this;
    }
    /** Adds one or more non-interactive text displays. */
    text(...inputs) {
        this.builder.addTextDisplayComponents(...inputs.map((input) => createText(input)));
        return this;
    }
    /** Adds a labelled interactive input to the modal. */
    label(source) {
        const child = createLabel(source);
        this.builder.addLabelComponents(child.toBuilder());
        return this;
    }
    /** Adds several labelled interactive inputs in order. */
    labels(...sources) {
        this.builder.addLabelComponents(...sources.map((source) => createLabel(source).toBuilder()));
        return this;
    }
    /**
     * Removes, replaces, or inserts labels.
     *
     * This follows Array.prototype.splice semantics.
     */
    spliceLabels(index, deleteCount, ...sources) {
        const labels = sources.map((source) => createLabel(source));
        this.builder.spliceLabelComponents(index, deleteCount, ...labels.map((label) => label.toBuilder()));
        return this;
    }
    /** Returns the underlying mutable Discord.js ModalBuilder. */
    toBuilder() {
        return this.builder;
    }
    /** Serializes the modal into Discord API-compatible JSON. */
    toJSON() {
        return this.builder.toJSON();
    }
}
/**
 * Creates a modal.
 */
export function modal(source) {
    if (source instanceof ModalBuilder) {
        return new V2ModalBuilder(source);
    }
    if (typeof source === "function") {
        return configureBuilder(new V2ModalBuilder(), source);
    }
    return new V2ModalBuilder(source);
}
//# sourceMappingURL=modal.js.map