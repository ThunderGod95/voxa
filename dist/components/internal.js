/**
 * Applies a builder configuration callback while preserving the original
 * builder when the callback returns void.
 *
 * @internal
 */
export function configureBuilder(builder, configure) {
    return configure(builder) ?? builder;
}
//# sourceMappingURL=internal.js.map