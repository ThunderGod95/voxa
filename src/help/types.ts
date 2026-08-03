import type { RGBTuple } from "discord.js";

/**
 * Configuration for Voxa's generated help command.
 */
export interface HelpCommandOptions {
    /**
     * Canonical command name.
     *
     * @defaultValue "help"
     */
    name?: string;

    /**
     * Description used for Discord application-command registration.
     *
     * @defaultValue "Browse available commands and view detailed usage."
     */
    description?: string;

    /**
     * Alternative names accepted by prefix commands.
     *
     * @defaultValue []
     */
    aliases?: readonly string[];

    /**
     * Whether the generated command is registered as a slash command.
     *
     * @defaultValue true
     */
    slash?: boolean;

    /**
     * Heading displayed at the top of the help browser.
     *
     * @defaultValue "Command Reference"
     */
    title?: string;

    /**
     * Introductory text displayed on the root help page.
     */
    intro?: string;

    /**
     * Accent color applied to the Components v2 container.
     *
     * @defaultValue 0x5865f2
     */
    accentColor?: number | RGBTuple | null;

    /**
     * Maximum entries rendered on one help page.
     *
     * Values must be between 1 and 20.
     *
     * @defaultValue 8
     */
    pageSize?: number;

    /**
     * Whether slash-command help responses are ephemeral.
     *
     * Prefix-command responses are always ordinary channel messages.
     *
     * @defaultValue true
     */
    ephemeral?: boolean;

    /**
     * How long interactive help controls remain active, in milliseconds.
     *
     * @defaultValue 300000
     */
    interactionTimeout?: number;
}

/**
 * Command-manager setting controlling generated help registration.
 *
 * - `undefined` or `true`: enable with defaults.
 * - `false`: disable generated help.
 * - an object: enable with custom options.
 */
export type HelpCommandConfig = boolean | HelpCommandOptions;

/** @internal */
export interface ResolvedHelpCommandOptions {
    name: string;
    description: string;
    aliases: readonly string[];
    slash: boolean;
    title: string;
    intro: string;
    accentColor: number | RGBTuple | null;
    pageSize: number;
    ephemeral: boolean;
    interactionTimeout: number;
}

const DEFAULT_HELP_OPTIONS: ResolvedHelpCommandOptions = {
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

function assertIntegerInRange(
    value: number,
    minimum: number,
    maximum: number,
    label: string,
): void {
    if (!Number.isInteger(value) || value < minimum || value > maximum) {
        throw new RangeError(
            `${label} must be an integer between ${minimum} and ${maximum}.`,
        );
    }
}

function assertLength(
    value: string,
    minimum: number,
    maximum: number,
    label: string,
): void {
    const length = value.trim().length;

    if (length < minimum || length > maximum) {
        throw new RangeError(
            `${label} must contain between ${minimum} and ${maximum} characters.`,
        );
    }
}

/** @internal */
export function resolveHelpCommandOptions(
    config: HelpCommandConfig | undefined,
): ResolvedHelpCommandOptions | null {
    if (config === false) {
        return null;
    }

    const supplied = config === true || config === undefined ? {} : config;

    const resolved: ResolvedHelpCommandOptions = {
        ...DEFAULT_HELP_OPTIONS,
        ...supplied,
        aliases: supplied.aliases ?? DEFAULT_HELP_OPTIONS.aliases,
    };

    assertIntegerInRange(resolved.pageSize, 1, 20, "Help pageSize");
    assertIntegerInRange(
        resolved.interactionTimeout,
        5_000,
        24 * 60 * 60 * 1000,
        "Help interactionTimeout",
    );

    assertLength(resolved.title, 1, 100, "Help title");
    assertLength(resolved.intro, 1, 3_000, "Help intro");

    return resolved;
}
