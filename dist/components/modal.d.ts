import type { APIModalInteractionResponseCallbackData, JSONEncodable } from "discord.js";
import { ModalBuilder } from "discord.js";
import { type BuilderConfigurer } from "./internal";
import { type LabelSource } from "./label";
import { type TextDisplayInput } from "./primitives";
export type ModalSource = ModalBuilder | Partial<APIModalInteractionResponseCallbackData> | BuilderConfigurer<V2ModalBuilder>;
/**
 * Fluent wrapper around Discord.js ModalBuilder.
 *
 * Labels are used for interactive modal inputs. Text displays may be added
 * directly to the modal for non-interactive content.
 */
export declare class V2ModalBuilder implements JSONEncodable<APIModalInteractionResponseCallbackData> {
    private readonly builder;
    constructor(source?: ModalBuilder | Partial<APIModalInteractionResponseCallbackData>);
    /** Number of direct components currently contained by the modal. */
    get componentCount(): number;
    /** Sets the identifier returned when the modal is submitted. */
    customId(customId: string): this;
    /** Sets the modal title. */
    title(title: string): this;
    /** Adds one or more non-interactive text displays. */
    text(...inputs: TextDisplayInput[]): this;
    /** Adds a labelled interactive input to the modal. */
    label(source?: LabelSource): this;
    /** Adds several labelled interactive inputs in order. */
    labels(...sources: LabelSource[]): this;
    /**
     * Removes, replaces, or inserts labels.
     *
     * This follows Array.prototype.splice semantics.
     */
    spliceLabels(index: number, deleteCount: number, ...sources: LabelSource[]): this;
    /** Returns the underlying mutable Discord.js ModalBuilder. */
    toBuilder(): ModalBuilder;
    /** Serializes the modal into Discord API-compatible JSON. */
    toJSON(): APIModalInteractionResponseCallbackData;
}
/**
 * Creates a modal.
 */
export declare function modal(source?: ModalSource): V2ModalBuilder;
//# sourceMappingURL=modal.d.ts.map