import { ChannelSelectMenuBuilder, FileUploadBuilder, MentionableSelectMenuBuilder, RoleSelectMenuBuilder, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle, UserSelectMenuBuilder } from "discord.js";
import { type BuilderConfigurer } from "./internal";
export type StringSelectInput = StringSelectMenuBuilder | BuilderConfigurer<StringSelectMenuBuilder>;
export type UserSelectInput = UserSelectMenuBuilder | BuilderConfigurer<UserSelectMenuBuilder>;
export type RoleSelectInput = RoleSelectMenuBuilder | BuilderConfigurer<RoleSelectMenuBuilder>;
export type MentionableSelectInput = MentionableSelectMenuBuilder | BuilderConfigurer<MentionableSelectMenuBuilder>;
export type ChannelSelectInput = ChannelSelectMenuBuilder | BuilderConfigurer<ChannelSelectMenuBuilder>;
/**
 * Creates or normalizes a string select menu.
 */
export declare function stringSelect(input: StringSelectInput): StringSelectMenuBuilder;
/**
 * Creates or normalizes a user select menu.
 */
export declare function userSelect(input: UserSelectInput): UserSelectMenuBuilder;
/**
 * Creates or normalizes a role select menu.
 */
export declare function roleSelect(input: RoleSelectInput): RoleSelectMenuBuilder;
/**
 * Creates or normalizes a mentionable select menu.
 */
export declare function mentionableSelect(input: MentionableSelectInput): MentionableSelectMenuBuilder;
/**
 * Creates or normalizes a channel select menu.
 */
export declare function channelSelect(input: ChannelSelectInput): ChannelSelectMenuBuilder;
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
export declare function textInput(input: TextInputInput): TextInputBuilder;
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
export declare function fileUpload(input: FileUploadInput): FileUploadBuilder;
//# sourceMappingURL=inputs.d.ts.map