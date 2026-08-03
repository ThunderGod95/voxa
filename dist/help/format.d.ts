import { type ArgumentSchema } from "../arguments";
import type { CommandRoute } from "../manager/route";
export declare function escapeInlineCode(value: string): string;
export declare function formatCommandPath(path: readonly string[]): string;
export declare function formatTargetLabel(path: readonly string[]): string;
export declare function formatMessageUsage(route: CommandRoute, prefix: string): string;
export declare function formatMessageDefaultUsage(route: CommandRoute, prefix: string): string | null;
export declare function formatArgumentEntries(schema: ArgumentSchema): string[];
export declare function formatAccess(route: CommandRoute): string | null;
export declare function formatAliases(route: CommandRoute): string | null;
//# sourceMappingURL=format.d.ts.map