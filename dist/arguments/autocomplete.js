import { resolveArgumentChoices } from "./choices";
const MAX_AUTOCOMPLETE_CHOICES = 25;
function isAutocompletableArgument(definition) {
    return (definition.type === "string" ||
        definition.type === "integer" ||
        definition.type === "number" ||
        definition.type === "timezone" ||
        definition.type === "time" ||
        definition.type === "url");
}
function assertAutocompleteChoiceType(definition, value) {
    const expectsNumber = definition.type === "integer" || definition.type === "number";
    if (expectsNumber && typeof value !== "number") {
        throw new Error(`Autocomplete for a ${definition.type} argument returned ` +
            `a non-number value: ${String(value)}.`);
    }
    if (!expectsNumber && typeof value !== "string") {
        throw new Error(`Autocomplete for a ${definition.type} argument returned ` +
            `a non-string value: ${String(value)}.`);
    }
}
export async function respondToArgumentAutocomplete(schema, interaction) {
    const focused = interaction.options.getFocused(true);
    const definition = schema[focused.name];
    if (!definition ||
        !isAutocompletableArgument(definition) ||
        definition.autocomplete === undefined) {
        return false;
    }
    const result = await definition.autocomplete({
        interaction,
        name: focused.name,
        value: focused.value,
    });
    const resolved = resolveArgumentChoices(result);
    const response = [];
    for (const choice of resolved.slice(0, MAX_AUTOCOMPLETE_CHOICES)) {
        if (choice.name.length < 1 || choice.name.length > 100) {
            throw new Error(`Autocomplete choice names must contain between ` +
                `1 and 100 characters. Received "${choice.name}".`);
        }
        assertAutocompleteChoiceType(definition, choice.value);
        const validation = await definition._schema.safeParseAsync(choice.value);
        if (!validation.success) {
            throw new Error(`Autocomplete value "${String(choice.value)}" for ` +
                `"${focused.name}" is invalid: ` +
                `${validation.error.issues[0]?.message ?? "Invalid value."}`);
        }
        response.push(choice);
    }
    await interaction.respond(response);
    return true;
}
//# sourceMappingURL=autocomplete.js.map