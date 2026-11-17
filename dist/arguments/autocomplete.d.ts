import type { AutocompleteInteraction } from "discord.js";
import type { ArgumentSchema } from "./types";
/**
 * Runs the autocomplete callback attached to the focused argument.
 */
export declare function respondToArgumentAutocomplete(schema: ArgumentSchema, interaction: AutocompleteInteraction): Promise<boolean>;
//# sourceMappingURL=autocomplete.d.ts.map