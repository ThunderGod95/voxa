import { ChannelSelectMenuBuilder, FileUploadBuilder, MentionableSelectMenuBuilder, RoleSelectMenuBuilder, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle, UserSelectMenuBuilder, } from "discord.js";
import { configureBuilder } from "./internal";
/**
 * Creates or normalizes a string select menu.
 */
export function stringSelect(input) {
    if (input instanceof StringSelectMenuBuilder) {
        return input;
    }
    return configureBuilder(new StringSelectMenuBuilder(), input);
}
/**
 * Creates or normalizes a user select menu.
 */
export function userSelect(input) {
    if (input instanceof UserSelectMenuBuilder) {
        return input;
    }
    return configureBuilder(new UserSelectMenuBuilder(), input);
}
/**
 * Creates or normalizes a role select menu.
 */
export function roleSelect(input) {
    if (input instanceof RoleSelectMenuBuilder) {
        return input;
    }
    return configureBuilder(new RoleSelectMenuBuilder(), input);
}
/**
 * Creates or normalizes a mentionable select menu.
 */
export function mentionableSelect(input) {
    if (input instanceof MentionableSelectMenuBuilder) {
        return input;
    }
    return configureBuilder(new MentionableSelectMenuBuilder(), input);
}
/**
 * Creates or normalizes a channel select menu.
 */
export function channelSelect(input) {
    if (input instanceof ChannelSelectMenuBuilder) {
        return input;
    }
    return configureBuilder(new ChannelSelectMenuBuilder(), input);
}
/**
 * Creates or normalizes a modal text input.
 *
 * Labels should be used to provide the user-facing label and description.
 */
export function textInput(input) {
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
/**
 * Creates or normalizes a modal file upload input.
 */
export function fileUpload(input) {
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
//# sourceMappingURL=inputs.js.map