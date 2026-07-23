/**
 * Defines a strongly typed Discord client event handler.
 *
 * This helper preserves contextual typing for every argument passed to
 * `execute`.
 *
 * @example
 * ```ts
 * export default defineEvent({
 *     name: Events.MessageCreate,
 *
 *     async execute(message) {
 *         console.log(message.content);
 *     },
 * });
 * ```
 */
export function defineEvent(definition) {
    return definition;
}
//# sourceMappingURL=event.js.map