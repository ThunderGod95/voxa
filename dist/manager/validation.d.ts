import type { CommandRoute } from "./route";
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
 *
 * @param route - Route to validate.
 *
 * @throws Error when the route cannot be safely registered.
 */
export declare function validateCommandRoute(route: CommandRoute): void;
//# sourceMappingURL=validation.d.ts.map