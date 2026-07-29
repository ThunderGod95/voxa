import type {
	APIModalInteractionResponseCallbackData,
	JSONEncodable,
} from "discord.js";
import { ModalBuilder } from "discord.js";
import { type BuilderConfigurer, configureBuilder } from "./internal";
import {
	label as createLabel,
	type LabelSource,
	type V2LabelBuilder,
} from "./label";
import { text as createText, type TextDisplayInput } from "./primitives";

export type ModalSource =
	| ModalBuilder
	| Partial<APIModalInteractionResponseCallbackData>
	| BuilderConfigurer<V2ModalBuilder>;

/**
 * Fluent wrapper around Discord.js ModalBuilder.
 *
 * Labels are used for interactive modal inputs. Text displays may be added
 * directly to the modal for non-interactive content.
 */
export class V2ModalBuilder
	implements JSONEncodable<APIModalInteractionResponseCallbackData>
{
	private readonly builder: ModalBuilder;

	public constructor(
		source:
			| ModalBuilder
			| Partial<APIModalInteractionResponseCallbackData> = {},
	) {
		this.builder =
			source instanceof ModalBuilder ? source : new ModalBuilder(source);
	}

	/** Number of direct components currently contained by the modal. */
	public get componentCount(): number {
		return this.builder.components.length;
	}

	/** Sets the identifier returned when the modal is submitted. */
	public customId(customId: string): this {
		this.builder.setCustomId(customId);
		return this;
	}

	/** Sets the modal title. */
	public title(title: string): this {
		this.builder.setTitle(title);
		return this;
	}

	/** Adds one or more non-interactive text displays. */
	public text(...inputs: TextDisplayInput[]): this {
		this.builder.addTextDisplayComponents(
			...inputs.map((input) => createText(input)),
		);

		return this;
	}

	/** Adds a labelled interactive input to the modal. */
	public label(source?: LabelSource): this {
		const child = createLabel(source);

		this.builder.addLabelComponents(child.toBuilder());
		return this;
	}

	/** Adds several labelled interactive inputs in order. */
	public labels(...sources: LabelSource[]): this {
		this.builder.addLabelComponents(
			...sources.map((source) => createLabel(source).toBuilder()),
		);

		return this;
	}

	/**
	 * Removes, replaces, or inserts labels.
	 *
	 * This follows Array.prototype.splice semantics.
	 */
	public spliceLabels(
		index: number,
		deleteCount: number,
		...sources: LabelSource[]
	): this {
		const labels: V2LabelBuilder[] = sources.map((source) =>
			createLabel(source),
		);

		this.builder.spliceLabelComponents(
			index,
			deleteCount,
			...labels.map((label) => label.toBuilder()),
		);

		return this;
	}

	/** Returns the underlying mutable Discord.js ModalBuilder. */
	public toBuilder(): ModalBuilder {
		return this.builder;
	}

	/** Serializes the modal into Discord API-compatible JSON. */
	public toJSON(): APIModalInteractionResponseCallbackData {
		return this.builder.toJSON();
	}
}

/**
 * Creates a modal.
 */
export function modal(source?: ModalSource): V2ModalBuilder {
	if (source instanceof ModalBuilder) {
		return new V2ModalBuilder(source);
	}

	if (typeof source === "function") {
		return configureBuilder(new V2ModalBuilder(), source);
	}

	return new V2ModalBuilder(source);
}
