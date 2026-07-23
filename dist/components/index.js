import { actionRow } from "./actionRow";
import { container } from "./container";
import { mediaGallery } from "./mediaGallery";
import { button, file, linkButton, mediaGalleryItem, premiumButton, separator, text, thumbnail, } from "./primitives";
import { section } from "./section";
export * from "./actionRow";
export * from "./container";
export * from "./internal";
export * from "./mediaGallery";
export * from "./primitives";
export * from "./section";
/**
 * Namespaced Components V2 factory API.
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
    container,
    file,
    linkButton,
    mediaGallery,
    mediaGalleryItem,
    premiumButton,
    section,
    separator,
    text,
    thumbnail,
});
//# sourceMappingURL=index.js.map