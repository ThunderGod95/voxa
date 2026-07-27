import type { AutocompleteInteraction } from "discord.js";
import { resolveArgumentChoices } from "./choices";
import type {
    ArgumentChoices,
    ArgumentChoiceValue,
    ArgumentSchema,
    CommandArgumentDefinition,
} from "./types";

const MAX_AUTOCOMPLETE_CHOICES = 25;

type AutocompletableArgumentDefinition = Extract<
    CommandArgumentDefinition,
    {
        type: "string" | "integer" | "number" | "timezone" | "time" | "url";
    }
>;

function isAutocompletableArgument(
    definition: CommandArgumentDefinition,
): definition is AutocompletableArgumentDefinition {
    return (
        definition.type === "string" ||
        definition.type === "integer" ||
        definition.type === "number" ||
        definition.type === "timezone" ||
        definition.type === "time" ||
        definition.type === "url"
    );
}

function assertAutocompleteChoiceType(
    definition: AutocompletableArgumentDefinition,
    value: ArgumentChoiceValue,
): void {
    const expectsNumber =
        definition.type === "integer" || definition.type === "number";

    if (expectsNumber && typeof value !== "number") {
        throw new Error(
            `Autocomplete for a ${definition.type} argument returned ` +
                `a non-number value: ${String(value)}.`,
        );
    }

    if (!expectsNumber && typeof value !== "string") {
        throw new Error(
            `Autocomplete for a ${definition.type} argument returned ` +
                `a non-string value: ${String(value)}.`,
        );
    }
}

export async function respondToArgumentAutocomplete(
    schema: ArgumentSchema,
    interaction: AutocompleteInteraction,
): Promise<boolean> {
    const focused = interaction.options.getFocused(true);
    const definition = schema[focused.name];

    if (
        !definition ||
        !isAutocompletableArgument(definition) ||
        definition.autocomplete === undefined
    ) {
        return false;
    }

    const result = await definition.autocomplete({
        interaction,
        name: focused.name,
        value: focused.value,
    });

    const resolved = resolveArgumentChoices(
        result as ArgumentChoices<ArgumentChoiceValue>,
    );

    const response = [];

    for (const choice of resolved.slice(0, MAX_AUTOCOMPLETE_CHOICES)) {
        if (choice.name.length < 1 || choice.name.length > 100) {
            throw new Error(
                `Autocomplete choice names must contain between ` +
                    `1 and 100 characters. Received "${choice.name}".`,
            );
        }

        assertAutocompleteChoiceType(definition, choice.value);

        const validation = await definition._schema.safeParseAsync(
            choice.value,
        );

        if (!validation.success) {
            throw new Error(
                `Autocomplete value "${String(choice.value)}" for ` +
                    `"${focused.name}" is invalid: ` +
                    `${validation.error.issues[0]?.message ?? "Invalid value."}`,
            );
        }

        response.push(choice);
    }

    await interaction.respond(response);

    return true;
}
