function getMessageCollectorChannel(channel) {
    if (!channel || !("createMessageCollector" in channel)) {
        throw new Error("This command channel does not support message collectors.");
    }
    return channel;
}
function createComponentFilter(userId, sameUser, customId, customIds, filter) {
    const allowedCustomIds = customIds === undefined ? null : new Set(customIds);
    return async (...args) => {
        const [interaction] = args;
        if (sameUser && interaction.user.id !== userId) {
            return false;
        }
        if (customId !== undefined && interaction.customId !== customId) {
            return false;
        }
        if (allowedCustomIds !== null &&
            !allowedCustomIds.has(interaction.customId)) {
            return false;
        }
        if (filter && !(await filter(...args))) {
            return false;
        }
        return true;
    };
}
function createMessageFilter(userId, sameUser, filter) {
    return async (...args) => {
        const [message] = args;
        if (sameUser && message.author.id !== userId) {
            return false;
        }
        if (filter && !(await filter(...args))) {
            return false;
        }
        return true;
    };
}
function createModalFilter(userId, sameUser, customId, filter) {
    return async (...args) => {
        const [interaction] = args;
        if (sameUser && interaction.user.id !== userId) {
            return false;
        }
        if (customId !== undefined && interaction.customId !== customId) {
            return false;
        }
        if (filter && !(await filter(...args))) {
            return false;
        }
        return true;
    };
}
/**
 * Awaits one component interaction on a specific message.
 *
 * @internal
 */
export function awaitCommandComponent(message, userId, options) {
    const { componentType, customId, customIds, sameUser = true, filter, ...collectorOptions } = options;
    return message.awaitMessageComponent({
        ...collectorOptions,
        componentType,
        filter: createComponentFilter(userId, sameUser, customId, customIds, filter),
    });
}
/**
 * Creates a native Discord.js component collector on a specific message.
 *
 * @internal
 */
export function createCommandComponentCollector(message, userId, options) {
    const { componentType, customId, customIds, sameUser = true, filter, ...collectorOptions } = options;
    return message.createMessageComponentCollector({
        ...collectorOptions,
        componentType,
        filter: createComponentFilter(userId, sameUser, customId, customIds, filter),
    });
}
/**
 * Creates a native Discord.js message collector in the command channel.
 *
 * @internal
 */
export function createCommandMessageCollector(channel, userId, options = {}) {
    const collectorChannel = getMessageCollectorChannel(channel);
    const { sameUser = true, filter, ...collectorOptions } = options;
    return collectorChannel.createMessageCollector({
        ...collectorOptions,
        filter: createMessageFilter(userId, sameUser, filter),
    });
}
/**
 * Awaits one message in the command channel.
 *
 * @internal
 */
export function awaitCommandMessage(channel, userId, options = {}) {
    const collector = createCommandMessageCollector(channel, userId, {
        ...options,
        max: 1,
    });
    return collector.next;
}
/**
 * Awaits one modal submission originating from an interaction command.
 *
 * @internal
 */
export function awaitCommandModal(interaction, userId, options) {
    if (!interaction) {
        throw new Error("Modal submissions can only be awaited from interaction commands.");
    }
    const { customId, sameUser = true, filter, ...collectorOptions } = options;
    return interaction.awaitModalSubmit({
        ...collectorOptions,
        filter: createModalFilter(userId, sameUser, customId, filter),
    });
}
//# sourceMappingURL=collectors.js.map