import type {
    APIFileComponent,
    APIMediaGalleryItem,
    APISeparatorComponent,
    APITextDisplayComponent,
    APIThumbnailComponent,
    ComponentEmojiResolvable,
    Snowflake,
} from "discord.js";
import {
    ButtonBuilder,
    ButtonStyle,
    FileBuilder,
    MediaGalleryItemBuilder,
    SeparatorBuilder,
    TextDisplayBuilder,
    ThumbnailBuilder,
} from "discord.js";

/**
 * Content accepted when constructing a text display.
 */
export type TextDisplayInput =
    string | TextDisplayBuilder | Partial<APITextDisplayComponent>;

/**
 * Creates or normalizes a Discord.js TextDisplayBuilder.
 */
export function text(input: TextDisplayInput): TextDisplayBuilder {
    if (input instanceof TextDisplayBuilder) {
        return input;
    }

    if (typeof input === "string") {
        return new TextDisplayBuilder().setContent(input);
    }

    return new TextDisplayBuilder(input);
}

/**
 * Configuration accepted when constructing a separator.
 */
export type SeparatorInput = SeparatorBuilder | Partial<APISeparatorComponent>;

/**
 * Creates or normalizes a Discord.js SeparatorBuilder.
 */
export function separator(input: SeparatorInput = {}): SeparatorBuilder {
    if (input instanceof SeparatorBuilder) {
        return input;
    }

    return new SeparatorBuilder(input);
}

export interface FileOptions {
    /** Whether the rendered file should be hidden behind a spoiler. */
    spoiler?: boolean;

    /** Optional numeric component identifier. */
    id?: number;
}

/**
 * Input accepted when constructing a file component.
 *
 * String inputs represent attachment names, not external URLs.
 *
 * Examples:
 * - "report.pdf"
 * - "attachment://report.pdf"
 */
export type FileInput = string | FileBuilder | Partial<APIFileComponent>;

function normalizeAttachmentUrl(value: string): string {
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
        throw new TypeError(
            "File components only support uploaded attachments. " +
                'Pass the attachment filename, such as "report.pdf", ' +
                "instead of an external URL.",
        );
    }

    return `attachment://${normalized}`;
}

/**
 * Creates or normalizes a Discord.js FileBuilder.
 *
 * The provided filename must match an attachment uploaded through the
 * message's `files` option.
 */
export function file(input: FileInput, options: FileOptions = {}): FileBuilder {
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

export interface ThumbnailOptions {
    /** Alternative text for the thumbnail. */
    description?: string;

    /** Whether the thumbnail should be hidden behind a spoiler. */
    spoiler?: boolean;

    /** Optional numeric component identifier. */
    id?: number;
}

export type ThumbnailInput =
    string | ThumbnailBuilder | Partial<APIThumbnailComponent>;

/**
 * Creates or normalizes a Discord.js ThumbnailBuilder.
 */
export function thumbnail(
    input: ThumbnailInput,
    options: ThumbnailOptions = {},
): ThumbnailBuilder {
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

export interface MediaGalleryItemOptions {
    /** URL or attachment URL displayed by the gallery item. */
    url: string;

    /** Alternative text for the media item. */
    description?: string;

    /** Whether the media item should be hidden behind a spoiler. */
    spoiler?: boolean;
}

export type MediaGalleryItemInput =
    | string
    | MediaGalleryItemOptions
    | MediaGalleryItemBuilder
    | Partial<APIMediaGalleryItem>;

function createMediaGalleryItem(
    url: string,
    options: Omit<MediaGalleryItemOptions, "url"> = {},
): MediaGalleryItemBuilder {
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
export function mediaGalleryItem(
    input: MediaGalleryItemInput,
): MediaGalleryItemBuilder {
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

/**
 * Styles permitted for interactive custom-ID buttons.
 *
 * Link and Premium styles are configured through their dedicated factories.
 */
export type InteractiveButtonStyle =
    | ButtonStyle.Primary
    | ButtonStyle.Secondary
    | ButtonStyle.Success
    | ButtonStyle.Danger;

interface BaseButtonOptions {
    /** Text displayed on the button. */
    label?: string;

    /** Emoji displayed on the button. */
    emoji?: ComponentEmojiResolvable;

    /** Whether the button is disabled. */
    disabled?: boolean;

    /** Optional numeric component identifier. */
    id?: number;
}

export interface ButtonOptions extends BaseButtonOptions {
    /** Identifier returned in the component interaction. */
    customId: string;

    /** Visual style. Defaults to ButtonStyle.Secondary. */
    style?: InteractiveButtonStyle;
}

export interface LinkButtonOptions extends BaseButtonOptions {
    /** URL opened when the button is selected. */
    url: string;
}

export interface PremiumButtonOptions {
    /** SKU associated with the premium button. */
    skuId: Snowflake;

    /** Whether the button is disabled. */
    disabled?: boolean;

    /** Optional numeric component identifier. */
    id?: number;
}

function applyButtonPresentation(
    builder: ButtonBuilder,
    options: BaseButtonOptions,
): void {
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
export function button(input: ButtonBuilder | ButtonOptions): ButtonBuilder {
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
export function linkButton(
    input: ButtonBuilder | LinkButtonOptions,
): ButtonBuilder {
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
export function premiumButton(
    input: ButtonBuilder | PremiumButtonOptions,
): ButtonBuilder {
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
