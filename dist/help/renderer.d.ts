import { type InteractionUpdateOptions } from "discord.js";
import type { CommandReplyOptions } from "../context";
import type { HelpTarget } from "./catalog";
import type { ResolvedHelpCommandOptions } from "./types";
export interface HelpComponentIds {
    select: string;
    previous: string;
    next: string;
    back: string;
    home: string;
}
export interface HelpPageState {
    target: HelpTarget | null;
    entries: readonly HelpTarget[];
    page: number;
    pageCount: number;
    canGoBack: boolean;
    disabled?: boolean;
}
export interface HelpRenderContext {
    options: ResolvedHelpCommandOptions;
    prefix: string;
    ids: HelpComponentIds;
    state: HelpPageState;
}
export declare function renderHelpNotFound(options: ResolvedHelpCommandOptions, prefix: string, requestedPath: string, suggestions: readonly HelpTarget[]): CommandReplyOptions;
export declare function renderHelp(context: HelpRenderContext): CommandReplyOptions;
export declare function toHelpInteractionUpdate(payload: CommandReplyOptions): InteractionUpdateOptions;
//# sourceMappingURL=renderer.d.ts.map