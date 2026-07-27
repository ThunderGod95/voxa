export function getArgumentChoiceValues(choices) {
    if (Array.isArray(choices)) {
        return [...choices];
    }
    return Object.values(choices);
}
export function resolveArgumentChoices(choices) {
    if (Array.isArray(choices)) {
        return choices.map((value) => ({
            name: String(value),
            value,
        }));
    }
    return Object.entries(choices).map(([name, value]) => ({
        name,
        value,
    }));
}
export function formatArgumentChoiceValues(values) {
    return values
        .map((value) => {
        const escaped = String(value).replaceAll("`", "\\`");
        return `\`${escaped}\``;
    })
        .join(", ");
}
//# sourceMappingURL=choices.js.map