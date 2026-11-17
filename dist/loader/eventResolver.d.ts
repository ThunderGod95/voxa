import type { AnyEventDefinition } from "../events";
import type { LoadResult } from "./moduleLoader";
/**
 * Event definition resolved from a filesystem module.
 */
export interface ResolvedEventHandler {
    /**
     * Validated event definition.
     */
    definition: AnyEventDefinition;
    /**
     * Relative path of the defining module.
     */
    file: string;
}
/**
 * Result of converting imported modules into event handlers.
 */
export interface EventResolutionResponse {
    handlers: ResolvedEventHandler[];
    skipped: {
        file: string;
        reason: string;
    }[];
    failed: {
        file: string;
        error: string;
    }[];
}
/**
 * Converts dynamically imported modules into validated event handlers.
 *
 * A module may export its definition either as the default export or through
 * a named `event` export.
 *
 * Several handlers may target the same Discord event. Event names are
 * intentionally not treated as unique identifiers.
 */
export declare function resolveEventModules(modules: readonly LoadResult[]): EventResolutionResponse;
//# sourceMappingURL=eventResolver.d.ts.map