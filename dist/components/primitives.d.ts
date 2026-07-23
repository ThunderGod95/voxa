import type { APIFileComponent, APIMediaGalleryItem, APISeparatorComponent, APITextDisplayComponent, APIThumbnailComponent, ComponentEmojiResolvable, Snowflake } from "discord.js";
import { ButtonBuilder, ButtonStyle, FileBuilder, MediaGalleryItemBuilder, SeparatorBuilder, TextDisplayBuilder, ThumbnailBuilder } from "discord.js";
/**
 * Content accepted when constructing a text display.
 */
export type TextDisplayInput = string | TextDisplayBuilder | Partial<APITextDisplayComponent>;
/**
 * Creates or normalizes a Discord.js TextDisplayBuilder.
 */
export declare function text(input: TextDisplayInput): TextDisplayBuilder;
/**
 * Configuration accepted when constructing a separator.
 */
export type SeparatorInput = SeparatorBuilder | Partial<APISeparatorComponent>;
/**
 * Creates or normalizes a Discord.js SeparatorBuilder.
 */
export declare function separator(input?: SeparatorInput): SeparatorBuilder;
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
/**
 * Creates or normalizes a Discord.js FileBuilder.
 *
 * The provided filename must match an attachment uploaded through the
 * message's `files` option.
 */
export declare function file(input: FileInput, options?: FileOptions): FileBuilder;
export interface ThumbnailOptions {
    /** Alternative text for the thumbnail. */
    description?: string;
    /** Whether the thumbnail should be hidden behind a spoiler. */
    spoiler?: boolean;
    /** Optional numeric component identifier. */
    id?: number;
}
export type ThumbnailInput = string | ThumbnailBuilder | Partial<APIThumbnailComponent>;
/**
 * Creates or normalizes a Discord.js ThumbnailBuilder.
 */
export declare function thumbnail(input: ThumbnailInput, options?: ThumbnailOptions): ThumbnailBuilder;
export interface MediaGalleryItemOptions {
    /** URL or attachment URL displayed by the gallery item. */
    url: string;
    /** Alternative text for the media item. */
    description?: string;
    /** Whether the media item should be hidden behind a spoiler. */
    spoiler?: boolean;
}
export type MediaGalleryItemInput = string | MediaGalleryItemOptions | MediaGalleryItemBuilder | Partial<APIMediaGalleryItem>;
/**
 * Creates or normalizes a Discord.js MediaGalleryItemBuilder.
 */
export declare function mediaGalleryItem(input: MediaGalleryItemInput): MediaGalleryItemBuilder;
/**
 * Styles permitted for interactive custom-ID buttons.
 *
 * Link and Premium styles are configured through their dedicated factories.
 */
export type InteractiveButtonStyle = ButtonStyle.Primary | ButtonStyle.Secondary | ButtonStyle.Success | ButtonStyle.Danger;
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
/**
 * Creates an interactive custom-ID button.
 */
export declare function button(input: ButtonBuilder | ButtonOptions): ButtonBuilder;
/**
 * Creates a link button.
 */
export declare function linkButton(input: ButtonBuilder | LinkButtonOptions): ButtonBuilder;
/**
 * Creates a premium SKU button.
 */
export declare function premiumButton(input: ButtonBuilder | PremiumButtonOptions): ButtonBuilder;
export {};
//# sourceMappingURL=primitives.d.ts.map