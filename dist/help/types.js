const DEFAULT_HELP_OPTIONS = {
    name: "help",
    description: "Browse available commands and view detailed usage.",
    aliases: [],
    slash: true,
    title: "Command Reference",
    intro: "Browse every command registered with this bot, then open an entry for syntax, arguments, aliases, and access requirements.",
    accentColor: null,
    pageSize: 8,
    ephemeral: true,
    interactionTimeout: 5 * 60 * 1000,
};
function assertIntegerInRange(value, minimum, maximum, label) {
    if (!Number.isInteger(value) || value < minimum || value > maximum) {
        throw new RangeError(`${label} must be an integer between ${minimum} and ${maximum}.`);
    }
}
function assertLength(value, minimum, maximum, label) {
    const length = value.trim().length;
    if (length < minimum || length > maximum) {
        throw new RangeError(`${label} must contain between ${minimum} and ${maximum} characters.`);
    }
}
/** @internal */
export function resolveHelpCommandOptions(config) {
    if (config === false) {
        return null;
    }
    const supplied = config === true || config === undefined ? {} : config;
    const resolved = {
        ...DEFAULT_HELP_OPTIONS,
        ...supplied,
        aliases: supplied.aliases ?? DEFAULT_HELP_OPTIONS.aliases,
    };
    assertIntegerInRange(resolved.pageSize, 1, 20, "Help pageSize");
    assertIntegerInRange(resolved.interactionTimeout, 5_000, 24 * 60 * 60 * 1000, "Help interactionTimeout");
    assertLength(resolved.title, 1, 100, "Help title");
    assertLength(resolved.intro, 1, 3_000, "Help intro");
    return resolved;
}
//# sourceMappingURL=types.js.map