/** @internal Empty schema used by commands that declare no arguments. */
export const EMPTY_ARGUMENTS = {};
export function defineCommand(command) {
    return command;
}
/**
 * Defines command-group metadata while preserving its inferred type.
 *
 * This function does not register or modify the group.
 */
export function defineCommandGroup(group) {
    return group;
}
//# sourceMappingURL=command.js.map