import type { RGBTuple } from "discord.js";
import type { CommandReplyPayload } from "./reply";
export interface CommandFeedbackRenderer {
    error(message: string): CommandReplyPayload;
    success(message: string): CommandReplyPayload;
}
export interface ComponentFeedbackOptions {
    errorAccentColor?: number | RGBTuple;
    successAccentColor?: number | RGBTuple;
    errorPrefix?: string;
    successPrefix?: string;
}
export declare function createComponentFeedbackRenderer(options?: ComponentFeedbackOptions): CommandFeedbackRenderer;
export declare function createPlainTextFeedbackRenderer(options?: Pick<ComponentFeedbackOptions, "errorPrefix" | "successPrefix">): CommandFeedbackRenderer;
export declare const defaultCommandFeedbackRenderer: CommandFeedbackRenderer;
//# sourceMappingURL=feedback.d.ts.map