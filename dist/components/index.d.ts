import { actionRow } from "./actionRow";
import { container } from "./container";
import { mediaGallery } from "./mediaGallery";
import { button, file, linkButton, mediaGalleryItem, premiumButton, separator, text, thumbnail } from "./primitives";
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
export declare const component: Readonly<{
    actionRow: typeof actionRow;
    button: typeof button;
    container: typeof container;
    file: typeof file;
    linkButton: typeof linkButton;
    mediaGallery: typeof mediaGallery;
    mediaGalleryItem: typeof mediaGalleryItem;
    premiumButton: typeof premiumButton;
    section: typeof section;
    separator: typeof separator;
    text: typeof text;
    thumbnail: typeof thumbnail;
}>;
//# sourceMappingURL=index.d.ts.map