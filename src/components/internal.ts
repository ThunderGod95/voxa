/**
 * Configures a Voxa or Discord.js builder.
 *
 * Returning the builder is supported for compatibility with Discord.js callback
 * conventions, but is not required.
 */
export type BuilderConfigurer<Builder> = (builder: Builder) => Builder | void;

/**
 * Applies a builder configuration callback while preserving the original
 * builder when the callback returns void.
 *
 * @internal
 */
export function configureBuilder<Builder>(
    builder: Builder,
    configure: BuilderConfigurer<Builder>,
): Builder {
    return configure(builder) ?? builder;
}
