import { actionRow } from "./actionRow";
import { container } from "./container";
import { channelSelect, fileUpload, mentionableSelect, roleSelect, stringSelect, textInput, userSelect } from "./inputs";
import { label } from "./label";
import { mediaGallery } from "./mediaGallery";
import { modal } from "./modal";
import { button, file, linkButton, mediaGalleryItem, premiumButton, separator, text, thumbnail } from "./primitives";
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
export declare const component: Readonly<{
    actionRow: typeof actionRow;
    button: typeof button;
    channelSelect: typeof channelSelect;
    container: typeof container;
    file: typeof file;
    fileUpload: typeof fileUpload;
    label: typeof label;
    linkButton: typeof linkButton;
    mediaGallery: typeof mediaGallery;
    mediaGalleryItem: typeof mediaGalleryItem;
    mentionableSelect: typeof mentionableSelect;
    modal: typeof modal;
    premiumButton: typeof premiumButton;
    roleSelect: typeof roleSelect;
    section: typeof section;
    separator: typeof separator;
    stringSelect: typeof stringSelect;
    text: typeof text;
    textInput: typeof textInput;
    thumbnail: typeof thumbnail;
    userSelect: typeof userSelect;
}>;
//# sourceMappingURL=index.d.ts.map