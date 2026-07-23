/**
 * Default Voxa logger backed by the global console.
 */
export const defaultVoxaLogger = {
    error(message, ...args) {
        console.error(message, ...args);
    },
    warn(message, ...args) {
        console.warn(message, ...args);
    },
    info(message, ...args) {
        console.info(message, ...args);
    },
};
//# sourceMappingURL=logger.js.map