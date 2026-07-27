import {
    ChannelSelectMenuBuilder,
    FileUploadBuilder,
    MentionableSelectMenuBuilder,
    RoleSelectMenuBuilder,
    StringSelectMenuBuilder,
    TextInputBuilder,
    TextInputStyle,
    UserSelectMenuBuilder,
} from "discord.js";
import { type BuilderConfigurer, configureBuilder } from "./internal";

export type StringSelectInput =
    StringSelectMenuBuilder | BuilderConfigurer<StringSelectMenuBuilder>;

export type UserSelectInput =
    UserSelectMenuBuilder | BuilderConfigurer<UserSelectMenuBuilder>;

export type RoleSelectInput =
    RoleSelectMenuBuilder | BuilderConfigurer<RoleSelectMenuBuilder>;

export type MentionableSelectInput =
    | MentionableSelectMenuBuilder
    | BuilderConfigurer<MentionableSelectMenuBuilder>;

export type ChannelSelectInput =
    ChannelSelectMenuBuilder | BuilderConfigurer<ChannelSelectMenuBuilder>;

/**
 * Creates or normalizes a string select menu.
 */
export function stringSelect(
    input: StringSelectInput,
): StringSelectMenuBuilder {
    if (input instanceof StringSelectMenuBuilder) {
        return input;
    }

    return configureBuilder(new StringSelectMenuBuilder(), input);
}

/**
 * Creates or normalizes a user select menu.
 */
export function userSelect(input: UserSelectInput): UserSelectMenuBuilder {
    if (input instanceof UserSelectMenuBuilder) {
        return input;
    }

    return configureBuilder(new UserSelectMenuBuilder(), input);
}

/**
 * Creates or normalizes a role select menu.
 */
export function roleSelect(input: RoleSelectInput): RoleSelectMenuBuilder {
    if (input instanceof RoleSelectMenuBuilder) {
        return input;
    }

    return configureBuilder(new RoleSelectMenuBuilder(), input);
}

/**
 * Creates or normalizes a mentionable select menu.
 */
export function mentionableSelect(
    input: MentionableSelectInput,
): MentionableSelectMenuBuilder {
    if (input instanceof MentionableSelectMenuBuilder) {
        return input;
    }

    return configureBuilder(new MentionableSelectMenuBuilder(), input);
}

/**
 * Creates or normalizes a channel select menu.
 */
export function channelSelect(
    input: ChannelSelectInput,
): ChannelSelectMenuBuilder {
    if (input instanceof ChannelSelectMenuBuilder) {
        return input;
    }

    return configureBuilder(new ChannelSelectMenuBuilder(), input);
}

export interface TextInputOptions {
    /** Identifier returned when the modal is submitted. */
    customId: string;

    /** Input style. Defaults to TextInputStyle.Short. */
    style?: TextInputStyle;

    /** Initial input value. */
    value?: string;

    /** Placeholder displayed when the input is empty. */
    placeholder?: string;

    /** Minimum permitted input length. */
    minLength?: number;

    /** Maximum permitted input length. */
    maxLength?: number;

    /** Whether the input must be completed before submission. */
    required?: boolean;

    /** Optional numeric component identifier. */
    id?: number;
}

export type TextInputInput = TextInputBuilder | TextInputOptions;

/**
 * Creates or normalizes a modal text input.
 *
 * Labels should be used to provide the user-facing label and description.
 */
export function textInput(input: TextInputInput): TextInputBuilder {
    if (input instanceof TextInputBuilder) {
        return input;
    }

    const builder = new TextInputBuilder()
        .setCustomId(input.customId)
        .setStyle(input.style ?? TextInputStyle.Short);

    if (input.value !== undefined) {
        builder.setValue(input.value);
    }

    if (input.placeholder !== undefined) {
        builder.setPlaceholder(input.placeholder);
    }

    if (input.minLength !== undefined) {
        builder.setMinLength(input.minLength);
    }

    if (input.maxLength !== undefined) {
        builder.setMaxLength(input.maxLength);
    }

    if (input.required !== undefined) {
        builder.setRequired(input.required);
    }

    if (input.id !== undefined) {
        builder.setId(input.id);
    }

    return builder;
}

export interface FileUploadOptions {
    /** Identifier returned when the modal is submitted. */
    customId: string;

    /** Minimum number of files that may be submitted. */
    minValues?: number;

    /** Maximum number of files that may be submitted. */
    maxValues?: number;

    /** Whether at least one file must be provided. */
    required?: boolean;

    /** Optional numeric component identifier. */
    id?: number;
}

export type FileUploadInput = FileUploadBuilder | FileUploadOptions;

/**
 * Creates or normalizes a modal file upload input.
 */
export function fileUpload(input: FileUploadInput): FileUploadBuilder {
    if (input instanceof FileUploadBuilder) {
        return input;
    }

    const builder = new FileUploadBuilder().setCustomId(input.customId);

    if (input.minValues !== undefined) {
        builder.setMinValues(input.minValues);
    }

    if (input.maxValues !== undefined) {
        builder.setMaxValues(input.maxValues);
    }

    if (input.required !== undefined) {
        builder.setRequired(input.required);
    }

    if (input.id !== undefined) {
        builder.setId(input.id);
    }

    return builder;
}
