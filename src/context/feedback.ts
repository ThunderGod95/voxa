import type { RGBTuple } from "discord.js";
import { container } from "../components";
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

export function createComponentFeedbackRenderer(
    options: ComponentFeedbackOptions = {},
): CommandFeedbackRenderer {
    const errorAccentColor = options.errorAccentColor ?? 0xed4245;
    const successAccentColor = options.successAccentColor ?? 0x57f287;
    const errorPrefix = options.errorPrefix ?? "❌";
    const successPrefix = options.successPrefix ?? "✅";

    function render(
        message: string,
        prefix: string,
        accentColor: number | RGBTuple,
    ): CommandReplyPayload {
        const view = container()
            .accentColor(accentColor)
            .text(`${prefix} ${message}`);

        return {
            components: [view],
        };
    }

    return {
        error(message) {
            return render(message, errorPrefix, errorAccentColor);
        },

        success(message) {
            return render(message, successPrefix, successAccentColor);
        },
    };
}

export function createPlainTextFeedbackRenderer(
    options: Pick<
        ComponentFeedbackOptions,
        "errorPrefix" | "successPrefix"
    > = {},
): CommandFeedbackRenderer {
    const errorPrefix = options.errorPrefix ?? "❌";
    const successPrefix = options.successPrefix ?? "✅";

    return {
        error(message) {
            return `${errorPrefix} ${message}`;
        },

        success(message) {
            return `${successPrefix} ${message}`;
        },
    };
}

export const defaultCommandFeedbackRenderer = createComponentFeedbackRenderer();
