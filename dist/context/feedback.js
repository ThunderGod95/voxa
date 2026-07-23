import { container } from "../components";
export function createComponentFeedbackRenderer(options = {}) {
    const errorAccentColor = options.errorAccentColor ?? 0xed4245;
    const successAccentColor = options.successAccentColor ?? 0x57f287;
    const errorPrefix = options.errorPrefix ?? "❌";
    const successPrefix = options.successPrefix ?? "✅";
    function render(message, prefix, accentColor) {
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
export function createPlainTextFeedbackRenderer(options = {}) {
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
//# sourceMappingURL=feedback.js.map