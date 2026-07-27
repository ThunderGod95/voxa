import type { APILabelComponent, JSONEncodable } from "discord.js";
import { LabelBuilder } from "discord.js";
import { type ChannelSelectInput, type FileUploadInput, type MentionableSelectInput, type RoleSelectInput, type StringSelectInput, type TextInputInput, type UserSelectInput } from "./inputs";
import { type BuilderConfigurer } from "./internal";
export type LabelSource = LabelBuilder | Partial<APILabelComponent> | BuilderConfigurer<V2LabelBuilder>;
/**
 * Fluent wrapper around Discord.js LabelBuilder.
 *
 * A label associates user-facing text and an optional description with one
 * interactive modal component.
 */
export declare class V2LabelBuilder implements JSONEncodable<APILabelComponent> {
    private readonly builder;
    constructor(source?: LabelBuilder | Partial<APILabelComponent>);
    /** Sets the user-facing label text. */
    label(label: string): this;
    /** Sets additional descriptive text displayed below the label. */
    description(description: string): this;
    /** Removes the label description. */
    clearDescription(): this;
    /** Sets a text input as the label's interactive component. */
    textInput(input: TextInputInput): this;
    /** Sets a string select menu as the label's interactive component. */
    stringSelect(input: StringSelectInput): this;
    /** Sets a user select menu as the label's interactive component. */
    userSelect(input: UserSelectInput): this;
    /** Sets a role select menu as the label's interactive component. */
    roleSelect(input: RoleSelectInput): this;
    /** Sets a mentionable select menu as the label's interactive component. */
    mentionableSelect(input: MentionableSelectInput): this;
    /** Sets a channel select menu as the label's interactive component. */
    channelSelect(input: ChannelSelectInput): this;
    /** Sets a file upload as the label's interactive component. */
    fileUpload(input: FileUploadInput): this;
    /** Sets the numeric component identifier. */
    id(id: number): this;
    /** Removes the numeric component identifier. */
    clearId(): this;
    /** Returns the underlying mutable Discord.js LabelBuilder. */
    toBuilder(): LabelBuilder;
    /** Serializes the label into Discord API-compatible JSON. */
    toJSON(): APILabelComponent;
}
/**
 * Creates a modal label.
 */
export declare function label(source?: LabelSource): V2LabelBuilder;
//# sourceMappingURL=label.d.ts.map