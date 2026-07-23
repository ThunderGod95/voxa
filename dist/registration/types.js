/**
 * Factory helpers for constructing registration targets.
 */
export const slashCommandTarget = {
    global() {
        return { scope: "global" };
    },
    guild(guildId) {
        return { scope: "guild", guildId };
    },
    guilds(guildIds) {
        return { scope: "guilds", guildIds };
    },
};
/**
 * Error raised for a failed global or single-guild registration request.
 */
export class SlashCommandRegistrationError extends Error {
    scope;
    guildId;
    constructor(options) {
        super(options.message, { cause: options.cause });
        this.name = "SlashCommandRegistrationError";
        this.scope = options.scope;
        this.guildId = options.guildId;
    }
}
//# sourceMappingURL=types.js.map