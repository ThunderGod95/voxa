import {
    ContainerBuilder,
    type RGBTuple,
    TextDisplayBuilder,
} from "discord.js";
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
        const container = new ContainerBuilder()
            .setAccentColor(accentColor)
            .addTextDisplayComponents(
                new TextDisplayBuilder({
                    content: `${prefix} ${message}`,
                }),
            );

        return {
            components: [container],
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
