import type { CommandRoute } from "../manager";
import type { LoadResult } from "./moduleLoader";
export interface CommandResolutionResponse {
    routes: CommandRoute[];
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
 * Converts imported filesystem modules into canonical command routes.
 */
export declare function resolveCommandModules(modules: readonly LoadResult[]): CommandResolutionResponse;
//# sourceMappingURL=commandResolver.d.ts.map