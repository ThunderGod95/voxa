import { ButtonBuilder, ButtonStyle, FileBuilder, MediaGalleryItemBuilder, SeparatorBuilder, TextDisplayBuilder, ThumbnailBuilder, } from "discord.js";
/**
 * Creates or normalizes a Discord.js TextDisplayBuilder.
 */
export function text(input) {
    if (input instanceof TextDisplayBuilder) {
        return input;
    }
    if (typeof input === "string") {
        return new TextDisplayBuilder().setContent(input);
    }
    return new TextDisplayBuilder(input);
}
/**
 * Creates or normalizes a Discord.js SeparatorBuilder.
 */
export function separator(input = {}) {
    if (input instanceof SeparatorBuilder) {
        return input;
    }
    return new SeparatorBuilder(input);
}
function normalizeAttachmentUrl(value) {
    const normalized = value.trim();
    if (normalized.length === 0) {
        throw new TypeError("A file attachment name cannot be empty.");
    }
    if (normalized.startsWith("attachment://")) {
        const filename = normalized.slice("attachment://".length);
        if (filename.length === 0) {
            throw new TypeError("An attachment URL must include a filename.");
        }
        return normalized;
    }
    if (/^[a-z][a-z0-9+.-]*:/iu.test(normalized)) {
        throw new TypeError("File components only support uploaded attachments. " +
            'Pass the attachment filename, such as "report.pdf", ' +
            "instead of an external URL.");
    }
    return `attachment://${normalized}`;
}
/**
 * Creates or normalizes a Discord.js FileBuilder.
 *
 * The provided filename must match an attachment uploaded through the
 * message's `files` option.
 */
export function file(input, options = {}) {
    if (input instanceof FileBuilder) {
        return input;
    }
    if (typeof input !== "string") {
        return new FileBuilder(input);
    }
    const builder = new FileBuilder().setURL(normalizeAttachmentUrl(input));
    if (options.spoiler !== undefined) {
        builder.setSpoiler(options.spoiler);
    }
    if (options.id !== undefined) {
        builder.setId(options.id);
    }
    return builder;
}
/**
 * Creates or normalizes a Discord.js ThumbnailBuilder.
 */
export function thumbnail(input, options = {}) {
    if (input instanceof ThumbnailBuilder) {
        return input;
    }
    if (typeof input !== "string") {
        return new ThumbnailBuilder(input);
    }
    const builder = new ThumbnailBuilder().setURL(input);
    if (options.description !== undefined) {
        builder.setDescription(options.description);
    }
    if (options.spoiler !== undefined) {
        builder.setSpoiler(options.spoiler);
    }
    if (options.id !== undefined) {
        builder.setId(options.id);
    }
    return builder;
}
function createMediaGalleryItem(url, options = {}) {
    const builder = new MediaGalleryItemBuilder().setURL(url);
    if (options.description !== undefined) {
        builder.setDescription(options.description);
    }
    if (options.spoiler !== undefined) {
        builder.setSpoiler(options.spoiler);
    }
    return builder;
}
/**
 * Creates or normalizes a Discord.js MediaGalleryItemBuilder.
 */
export function mediaGalleryItem(input) {
    if (input instanceof MediaGalleryItemBuilder) {
        return input;
    }
    if (typeof input === "string") {
        return createMediaGalleryItem(input);
    }
    if ("url" in input && typeof input.url === "string") {
        return createMediaGalleryItem(input.url, {
            description: input.description,
            spoiler: input.spoiler,
        });
    }
    return new MediaGalleryItemBuilder(input);
}
function applyButtonPresentation(builder, options) {
    if (options.label !== undefined) {
        builder.setLabel(options.label);
    }
    if (options.emoji !== undefined) {
        builder.setEmoji(options.emoji);
    }
    if (options.disabled !== undefined) {
        builder.setDisabled(options.disabled);
    }
    if (options.id !== undefined) {
        builder.setId(options.id);
    }
}
/**
 * Creates an interactive custom-ID button.
 */
export function button(input) {
    if (input instanceof ButtonBuilder) {
        return input;
    }
    const builder = new ButtonBuilder()
        .setCustomId(input.customId)
        .setStyle(input.style ?? ButtonStyle.Secondary);
    applyButtonPresentation(builder, input);
    return builder;
}
/**
 * Creates a link button.
 */
export function linkButton(input) {
    if (input instanceof ButtonBuilder) {
        return input;
    }
    const builder = new ButtonBuilder()
        .setURL(input.url)
        .setStyle(ButtonStyle.Link);
    applyButtonPresentation(builder, input);
    return builder;
}
/**
 * Creates a premium SKU button.
 */
export function premiumButton(input) {
    if (input instanceof ButtonBuilder) {
        return input;
    }
    const builder = new ButtonBuilder()
        .setSKUId(input.skuId)
        .setStyle(ButtonStyle.Premium);
    if (input.disabled !== undefined) {
        builder.setDisabled(input.disabled);
    }
    if (input.id !== undefined) {
        builder.setId(input.id);
    }
    return builder;
}
//# sourceMappingURL=primitives.js.map