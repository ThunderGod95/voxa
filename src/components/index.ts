import { actionRow } from "./actionRow";
import { container } from "./container";
import {
	channelSelect,
	fileUpload,
	mentionableSelect,
	roleSelect,
	stringSelect,
	textInput,
	userSelect,
} from "./inputs";
import { label } from "./label";
import { mediaGallery } from "./mediaGallery";
import { modal } from "./modal";
import {
	button,
	file,
	linkButton,
	mediaGalleryItem,
	premiumButton,
	separator,
	text,
	thumbnail,
} from "./primitives";
import { section } from "./section";

export * from "./actionRow";
export * from "./container";
export * from "./inputs";
export * from "./internal";
export * from "./label";
export * from "./mediaGallery";
export * from "./modal";
export * from "./primitives";
export * from "./section";

/**
 * Namespaced component factory API.
 *
 * Every factory is also exported individually.
 *
 * @example
 * ```ts
 * component.container((container) => {
 *     container.text("Hello");
 * });
 * ```
 */
export const component = Object.freeze({
	actionRow,
	button,
	channelSelect,
	container,
	file,
	fileUpload,
	label,
	linkButton,
	mediaGallery,
	mediaGalleryItem,
	mentionableSelect,
	modal,
	premiumButton,
	roleSelect,
	section,
	separator,
	stringSelect,
	text,
	textInput,
	thumbnail,
	userSelect,
});
