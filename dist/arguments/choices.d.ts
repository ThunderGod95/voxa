import type { ArgumentChoices, ArgumentChoiceValue } from "./types";
export interface ResolvedArgumentChoice<Value extends ArgumentChoiceValue = ArgumentChoiceValue> {
    name: string;
    value: Value;
}
export declare function getArgumentChoiceValues<Value extends ArgumentChoiceValue>(choices: ArgumentChoices<Value>): Value[];
export declare function resolveArgumentChoices<Value extends ArgumentChoiceValue>(choices: ArgumentChoices<Value>): ResolvedArgumentChoice<Value>[];
export declare function formatArgumentChoiceValues(values: readonly ArgumentChoiceValue[]): string;
//# sourceMappingURL=choices.d.ts.map