import type { ClientEvents } from "discord.js";
/**
 * Name of an event emitted by a Discord.js client.
 */
export type ClientEventName = Extract<keyof ClientEvents, string>;
/**
 * Defines a strongly typed Discord client event handler.
 *
 * The arguments received by {@link EventDefinition.execute} are inferred from
 * the selected event name.
 *
 * @typeParam Name - Discord.js client event handled by this definition.
 */
export interface EventDefinition<Name extends ClientEventName = ClientEventName> {
    /**
     * Discord.js client event to handle.
     *
     * Prefer values from Discord.js's `Events` enum.
     */
    name: Name;
    /**
     * Whether the handler should be detached after its first invocation.
     *
     * @defaultValue false
     */
    once?: boolean;
    /**
     * Handles the Discord.js event.
     *
     * Synchronous exceptions and rejected promises are caught and reported by
     * {@link EventManager}.
     */
    execute(...args: ClientEvents[Name]): Promise<void> | void;
}
/**
 * Event definition whose exact event name is not statically known.
 *
 * Framework internals use this type after loading heterogeneous event modules.
 */
export type AnyEventDefinition = EventDefinition<ClientEventName>;
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
export declare function defineEvent<const Name extends ClientEventName>(definition: EventDefinition<Name>): EventDefinition<Name>;
//# sourceMappingURL=event.d.ts.map