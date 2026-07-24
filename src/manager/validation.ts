import { validateArgumentSchema } from "../arguments";
import { type AnyCommand, type CommandGroup, EMPTY_ARGUMENTS } from "./command";
import type { CommandRoute } from "./route";

const COMMAND_NAME_PATTERN = /^[a-z0-9_-]{1,32}$/u;

function validateName(name: string, label: string): void {
    if (!COMMAND_NAME_PATTERN.test(name)) {
        throw new Error(
            `${label} "${name}" must contain only lowercase letters, ` +
                "numbers, hyphens, or underscores and must be " +
                "1 to 32 characters long.",
        );
    }
}

function validateDescription(description: string, label: string): void {
    if (description.length < 1 || description.length > 100) {
        throw new Error(
            `${label} must have a description between 1 and 100 characters.`,
        );
    }
}

function validateAliases(aliases: readonly string[], label: string): void {
    for (const alias of aliases) {
        validateName(alias, `${label} alias`);
    }
}

function validateCommand(command: AnyCommand): void {
    validateName(command.name, "Command name");

    validateDescription(command.description, `Command "${command.name}"`);

    validateAliases(command.aliases ?? [], `Command "${command.name}"`);

    validateArgumentSchema(command.name, command.arguments ?? EMPTY_ARGUMENTS);
}

function validateGroup(
    group: CommandGroup,
    groupPath: readonly string[],
): void {
    const label = `Command group "${groupPath.join(" ")}"`;

    validateDescription(group.description, label);
    validateAliases(group.aliases ?? [], label);
}

/**
 * Validates a command route before registration or slash-command generation.
 *
 * Validation covers:
 *
 * - Discord command-name restrictions.
 * - Discord description-length restrictions.
 * - Alias names.
 * - Argument-schema constraints.
 * - Route depth.
 * - Required command-group metadata.
 * - Agreement between the route leaf and command name.
 * - Message-default placement.
 *
 * @param route - Route to validate.
 *
 * @throws Error when the route cannot be safely registered.
 */
export function validateCommandRoute(route: CommandRoute): void {
    const { path, command } = route;
    const groups = route.groups ?? [];

    if (path.length < 1 || path.length > 3) {
        throw new Error(
            `Command route "${path.join(" ")}" must contain 1 to 3 segments.`,
        );
    }

    for (const segment of path) {
        validateName(segment, "Command route segment");
    }

    if (path.at(-1) !== command.name) {
        throw new Error(
            `Command route "${path.join(" ")}" must end with ` +
                `the command name "${command.name}".`,
        );
    }

    if (groups.length !== path.length - 1) {
        throw new Error(
            `Command route "${path.join(" ")}" requires exactly ` +
                `${path.length - 1} group metadata entries.`,
        );
    }

    if (command.messageDefault && path.length === 1) {
        throw new Error(
            `Command route "${path.join(" ")}" cannot be a message default ` +
                "because it has no parent route.",
        );
    }

    validateCommand(command);

    groups.forEach((group, index) => {
        validateGroup(group, path.slice(0, index + 1));
    });
}
