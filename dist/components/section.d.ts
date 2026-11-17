import type { APISectionComponent, JSONEncodable } from "discord.js";
import { type ButtonBuilder, SectionBuilder } from "discord.js";
import { type BuilderConfigurer } from "./internal";
import { type ButtonOptions, type LinkButtonOptions, type PremiumButtonOptions, type TextDisplayInput, type ThumbnailInput, type ThumbnailOptions } from "./primitives";
export type SectionSource = SectionBuilder | Partial<APISectionComponent> | BuilderConfigurer<V2SectionBuilder>;
/**
 * Fluent wrapper around Discord.js SectionBuilder.
 *
 * A valid section must contain between one and three text displays and must
 * have either a button or thumbnail accessory. Discord.js validates those
 * constraints during serialization.
 */
export declare class V2SectionBuilder implements JSONEncodable<APISectionComponent> {
    private readonly builder;
    constructor(source?: SectionBuilder | Partial<APISectionComponent>);
    /** Number of text displays currently contained by the section. */
    get textCount(): number;
    /** Adds one or more text displays. */
    text(...inputs: TextDisplayInput[]): this;
    /** Sets an interactive custom-ID button as the section accessory. */
    button(input: ButtonBuilder | ButtonOptions): this;
    /** Sets a link button as the section accessory. */
    linkButton(input: ButtonBuilder | LinkButtonOptions): this;
    /** Sets a premium SKU button as the section accessory. */
    premiumButton(input: ButtonBuilder | PremiumButtonOptions): this;
    /** Sets a thumbnail as the section accessory. */
    thumbnail(input: ThumbnailInput, options?: ThumbnailOptions): this;
    /**
     * Removes, replaces, or inserts section text displays.
     *
     * This follows Array.prototype.splice semantics.
     */
    spliceText(index: number, deleteCount: number, ...inputs: TextDisplayInput[]): this;
    /** Sets the numeric component identifier. */
    id(id: number): this;
    /** Removes the numeric component identifier. */
    clearId(): this;
    /** Returns the underlying mutable Discord.js builder. */
    toBuilder(): SectionBuilder;
    /** Serializes the section into Discord API-compatible JSON. */
    toJSON(): APISectionComponent;
}
/**
 * Creates a Components V2 section.
 */
export declare function section(source?: SectionSource): V2SectionBuilder;
//# sourceMappingURL=section.d.ts.map