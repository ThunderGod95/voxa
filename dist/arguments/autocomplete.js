import { resolveArgumentChoices } from "./choices";
import { getSlashValueDefinition, isAutocompletableValueDefinition, } from "./value";
const MAX_AUTOCOMPLETE_CHOICES = 25;
function assertAutocompleteChoiceType(definition, choiceValue) {
    const expectsNumber = definition.type === "integer" || definition.type === "number";
    if (expectsNumber && typeof choiceValue !== "number") {
        throw new Error(`Autocomplete for a ${definition.type} argument returned ` +
            `a non-number value: ${String(choiceValue)}.`);
    }
    if (!expectsNumber && typeof choiceValue !== "string") {
        throw new Error(`Autocomplete for a ${definition.type} argument returned ` +
            `a non-string value: ${String(choiceValue)}.`);
    }
}
/**
 * Runs the autocomplete callback attached to the focused argument.
 */
export async function respondToArgumentAutocomplete(schema, interaction) {
    const focused = interaction.options.getFocused(true);
    const definition = schema[focused.name];
    if (!definition || definition.autocomplete === undefined) {
        return false;
    }
    const slashValue = getSlashValueDefinition(definition.value);
    if (!isAutocompletableValueDefinition(slashValue)) {
        return false;
    }
    const result = await definition.autocomplete({
        interaction,
        name: focused.name,
        value: focused.value,
    });
    const choices = resolveArgumentChoices(result);
    const response = [];
    for (const choice of choices.slice(0, MAX_AUTOCOMPLETE_CHOICES)) {
        if (choice.name.length < 1 || choice.name.length > 100) {
            throw new Error("Autocomplete choice names must contain between " +
                `1 and 100 characters. Received "${choice.name}".`);
        }
        assertAutocompleteChoiceType(slashValue, choice.value);
        const validation = await slashValue._schema.safeParseAsync(choice.value);
        if (!validation.success) {
            throw new Error(`Autocomplete value "${String(choice.value)}" for ` +
                `"${focused.name}" is invalid: ` +
                (validation.error.issues[0]?.message ?? "Invalid value."));
        }
        response.push(choice);
    }
    await interaction.respond(response);
    return true;
}
//# sourceMappingURL=autocomplete.js.map