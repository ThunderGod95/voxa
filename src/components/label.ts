import type { APILabelComponent, JSONEncodable } from "discord.js";
import { LabelBuilder } from "discord.js";
import {
    type ChannelSelectInput,
    channelSelect as createChannelSelect,
    fileUpload as createFileUpload,
    mentionableSelect as createMentionableSelect,
    roleSelect as createRoleSelect,
    stringSelect as createStringSelect,
    textInput as createTextInput,
    userSelect as createUserSelect,
    type FileUploadInput,
    type MentionableSelectInput,
    type RoleSelectInput,
    type StringSelectInput,
    type TextInputInput,
    type UserSelectInput,
} from "./inputs";
import { type BuilderConfigurer, configureBuilder } from "./internal";

export type LabelSource =
    | LabelBuilder
    | Partial<APILabelComponent>
    | BuilderConfigurer<V2LabelBuilder>;

/**
 * Fluent wrapper around Discord.js LabelBuilder.
 *
 * A label associates user-facing text and an optional description with one
 * interactive modal component.
 */
export class V2LabelBuilder implements JSONEncodable<APILabelComponent> {
    private readonly builder: LabelBuilder;

    public constructor(source: LabelBuilder | Partial<APILabelComponent> = {}) {
        this.builder =
            source instanceof LabelBuilder ? source : new LabelBuilder(source);
    }

    /** Sets the user-facing label text. */
    public label(label: string): this {
        this.builder.setLabel(label);
        return this;
    }

    /** Sets additional descriptive text displayed below the label. */
    public description(description: string): this {
        this.builder.setDescription(description);
        return this;
    }

    /** Removes the label description. */
    public clearDescription(): this {
        this.builder.clearDescription();
        return this;
    }

    /** Sets a text input as the label's interactive component. */
    public textInput(input: TextInputInput): this {
        this.builder.setTextInputComponent(createTextInput(input));
        return this;
    }

    /** Sets a string select menu as the label's interactive component. */
    public stringSelect(input: StringSelectInput): this {
        this.builder.setStringSelectMenuComponent(createStringSelect(input));
        return this;
    }

    /** Sets a user select menu as the label's interactive component. */
    public userSelect(input: UserSelectInput): this {
        this.builder.setUserSelectMenuComponent(createUserSelect(input));
        return this;
    }

    /** Sets a role select menu as the label's interactive component. */
    public roleSelect(input: RoleSelectInput): this {
        this.builder.setRoleSelectMenuComponent(createRoleSelect(input));
        return this;
    }

    /** Sets a mentionable select menu as the label's interactive component. */
    public mentionableSelect(input: MentionableSelectInput): this {
        this.builder.setMentionableSelectMenuComponent(
            createMentionableSelect(input),
        );

        return this;
    }

    /** Sets a channel select menu as the label's interactive component. */
    public channelSelect(input: ChannelSelectInput): this {
        this.builder.setChannelSelectMenuComponent(createChannelSelect(input));
        return this;
    }

    /** Sets a file upload as the label's interactive component. */
    public fileUpload(input: FileUploadInput): this {
        this.builder.setFileUploadComponent(createFileUpload(input));
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

    /** Returns the underlying mutable Discord.js LabelBuilder. */
    public toBuilder(): LabelBuilder {
        return this.builder;
    }

    /** Serializes the label into Discord API-compatible JSON. */
    public toJSON(): APILabelComponent {
        return this.builder.toJSON();
    }
}

/**
 * Creates a modal label.
 */
export function label(source?: LabelSource): V2LabelBuilder {
    if (source instanceof LabelBuilder) {
        return new V2LabelBuilder(source);
    }

    if (typeof source === "function") {
        return configureBuilder(new V2LabelBuilder(), source);
    }

    return new V2LabelBuilder(source);
}
