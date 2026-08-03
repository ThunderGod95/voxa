import { type CommandRoute } from "../manager/route";
export interface HelpCommandTarget {
    kind: "command";
    id: string;
    path: readonly string[];
    description: string;
    route: CommandRoute;
}
export interface HelpGroupTarget {
    kind: "group";
    id: string;
    path: readonly string[];
    description: string;
    routes: readonly CommandRoute[];
}
export type HelpTarget = HelpCommandTarget | HelpGroupTarget;
export interface HelpCatalogSource {
    getRoutes(): readonly CommandRoute[];
    isDeveloper(userId: string): boolean;
}
/**
 * Immutable, user-aware help index built from the manager's live route registry.
 *
 * @internal
 */
export declare class HelpCatalogView {
    private readonly targets;
    private readonly byId;
    private readonly commandLookup;
    private readonly groupLookup;
    constructor(targets: readonly HelpTarget[], byId: ReadonlyMap<string, HelpTarget>, commandLookup: ReadonlyMap<string, HelpCommandTarget>, groupLookup: ReadonlyMap<string, HelpGroupTarget>);
    getRootTargets(): HelpTarget[];
    getChildren(group: HelpGroupTarget): HelpTarget[];
    resolve(input: string): HelpTarget | null;
    resolveId(id: string): HelpTarget | null;
    autocomplete(input: string, limit?: number): readonly string[];
    suggest(input: string, limit?: number): HelpTarget[];
}
/**
 * Creates user-specific help views over the manager's current routes.
 *
 * @internal
 */
export declare class HelpCatalog {
    private readonly source;
    constructor(source: HelpCatalogSource);
    createView(userId: string): HelpCatalogView;
}
//# sourceMappingURL=catalog.d.ts.map