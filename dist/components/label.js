import { LabelBuilder } from "discord.js";
import { channelSelect as createChannelSelect, fileUpload as createFileUpload, mentionableSelect as createMentionableSelect, roleSelect as createRoleSelect, stringSelect as createStringSelect, textInput as createTextInput, userSelect as createUserSelect, } from "./inputs";
import { configureBuilder } from "./internal";
/**
 * Fluent wrapper around Discord.js LabelBuilder.
 *
 * A label associates user-facing text and an optional description with one
 * interactive modal component.
 */
export class V2LabelBuilder {
    builder;
    constructor(source = {}) {
        this.builder =
            source instanceof LabelBuilder ? source : new LabelBuilder(source);
    }
    /** Sets the user-facing label text. */
    label(label) {
        this.builder.setLabel(label);
        return this;
    }
    /** Sets additional descriptive text displayed below the label. */
    description(description) {
        this.builder.setDescription(description);
        return this;
    }
    /** Removes the label description. */
    clearDescription() {
        this.builder.clearDescription();
        return this;
    }
    /** Sets a text input as the label's interactive component. */
    textInput(input) {
        this.builder.setTextInputComponent(createTextInput(input));
        return this;
    }
    /** Sets a string select menu as the label's interactive component. */
    stringSelect(input) {
        this.builder.setStringSelectMenuComponent(createStringSelect(input));
        return this;
    }
    /** Sets a user select menu as the label's interactive component. */
    userSelect(input) {
        this.builder.setUserSelectMenuComponent(createUserSelect(input));
        return this;
    }
    /** Sets a role select menu as the label's interactive component. */
    roleSelect(input) {
        this.builder.setRoleSelectMenuComponent(createRoleSelect(input));
        return this;
    }
    /** Sets a mentionable select menu as the label's interactive component. */
    mentionableSelect(input) {
        this.builder.setMentionableSelectMenuComponent(createMentionableSelect(input));
        return this;
    }
    /** Sets a channel select menu as the label's interactive component. */
    channelSelect(input) {
        this.builder.setChannelSelectMenuComponent(createChannelSelect(input));
        return this;
    }
    /** Sets a file upload as the label's interactive component. */
    fileUpload(input) {
        this.builder.setFileUploadComponent(createFileUpload(input));
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
    /** Returns the underlying mutable Discord.js LabelBuilder. */
    toBuilder() {
        return this.builder;
    }
    /** Serializes the label into Discord API-compatible JSON. */
    toJSON() {
        return this.builder.toJSON();
    }
}
/**
 * Creates a modal label.
 */
export function label(source) {
    if (source instanceof LabelBuilder) {
        return new V2LabelBuilder(source);
    }
    if (typeof source === "function") {
        return configureBuilder(new V2LabelBuilder(), source);
    }
    return new V2LabelBuilder(source);
}
//# sourceMappingURL=label.js.map