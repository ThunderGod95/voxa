import type { ArgumentChoices, ArgumentChoiceValue } from "./types";

export interface ResolvedArgumentChoice<
    Value extends ArgumentChoiceValue = ArgumentChoiceValue,
> {
    name: string;
    value: Value;
}

export function getArgumentChoiceValues<Value extends ArgumentChoiceValue>(
    choices: ArgumentChoices<Value>,
): Value[] {
    if (Array.isArray(choices)) {
        return [...choices];
    }

    return Object.values(choices);
}

export function resolveArgumentChoices<Value extends ArgumentChoiceValue>(
    choices: ArgumentChoices<Value>,
): ResolvedArgumentChoice<Value>[] {
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

export function formatArgumentChoiceValues(
    values: readonly ArgumentChoiceValue[],
): string {
    return values
        .map((value) => {
            const escaped = String(value).replaceAll("`", "\\`");
            return `\`${escaped}\``;
        })
        .join(", ");
}
