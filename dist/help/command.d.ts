import type { CommandContext } from "../context";
import { type Command } from "../manager/command";
import type { CommandRoute } from "../manager/route";
import { HelpCatalog, type HelpCatalogSource } from "./catalog";
import type { ResolvedHelpCommandOptions } from "./types";
declare function createHelpArguments(catalog: HelpCatalog): {
    readonly command: import("..").StringArgumentDefinition<false, string>;
};
type HelpArgumentSchema = ReturnType<typeof createHelpArguments>;
export interface GeneratedHelpDependencies extends HelpCatalogSource {
    resolvePrefix(context: CommandContext<object>): Promise<string>;
}
/**
 * Creates the command registered automatically by CommandManager.
 *
 * @internal
 */
export declare function createGeneratedHelpCommand(options: ResolvedHelpCommandOptions, dependencies: GeneratedHelpDependencies): Command<HelpArgumentSchema>;
/** @internal */
export declare function createGeneratedHelpRoute(options: ResolvedHelpCommandOptions, dependencies: GeneratedHelpDependencies): CommandRoute;
export {};
//# sourceMappingURL=command.d.ts.map