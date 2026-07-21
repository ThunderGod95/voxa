import * as chrono from "chrono-node";
import moment from "moment-timezone";
import { resolveTimezone } from "./timezoneParser";

export interface ParseNaturalTimeOptions {
    /** The instant relative expressions such as "tomorrow" are based on. */
    reference?: Date;

    /** Optional IANA timezone in which the input should be interpreted. */
    timezone?: string;

    /** Prefer future dates when an expression is otherwise ambiguous. */
    forwardDate?: boolean;

    /** Parse only formal expressions instead of casual natural language. */
    strict?: boolean;
}

function isValidDate(value: Date): boolean {
    return !Number.isNaN(value.getTime());
}

function getRequiredComponent(
    components: chrono.ParsedComponents,
    name: chrono.Component,
): number | null {
    return components.get(name);
}

/**
 * Reconstructs Chrono's parsed wall-clock components inside an IANA timezone.
 *
 * This is intentionally not implemented by attaching the reference date's
 * UTC offset to the result. The target date may have a different offset due
 * to daylight-saving transitions.
 */
function createDateInTimezone(
    components: chrono.ParsedComponents,
    timezone: string,
): Date | null {
    const year = getRequiredComponent(components, "year");
    const month = getRequiredComponent(components, "month");
    const day = getRequiredComponent(components, "day");
    const hour = getRequiredComponent(components, "hour");
    const minute = getRequiredComponent(components, "minute");
    const second = getRequiredComponent(components, "second");
    const millisecond = getRequiredComponent(components, "millisecond");

    if (
        year === null ||
        month === null ||
        day === null ||
        hour === null ||
        minute === null ||
        second === null ||
        millisecond === null
    ) {
        return null;
    }

    const parsed = moment.tz(
        {
            year,
            month: month - 1,
            day,
            hour,
            minute,
            second,
            millisecond,
        },
        timezone,
    );

    return parsed.isValid() ? parsed.toDate() : null;
}

/**
 * Parses a natural-language date/time expression into an absolute Date.
 *
 * Examples:
 * - tomorrow at 5pm
 * - next Friday
 * - in three hours
 * - July 30 at 14:00
 */
export function parseNaturalTime(
    input: string,
    options: ParseNaturalTimeOptions = {},
): Date | null {
    const trimmed = input.trim();

    if (!trimmed) {
        return null;
    }

    const reference = options.reference ?? new Date();

    if (!isValidDate(reference)) {
        return null;
    }

    const timezone = options.timezone
        ? resolveTimezone(options.timezone)
        : null;

    if (options.timezone && !timezone) {
        return null;
    }

    const parser = options.strict ? chrono.strict : chrono.casual;

    const parsingReference: chrono.ParsingReference | Date = timezone
        ? {
              instant: reference,
              timezone: moment.tz(reference, timezone).utcOffset(),
          }
        : reference;

    const result = parser.parse(trimmed, parsingReference, {
        forwardDate: options.forwardDate,
    })[0];

    if (!result) {
        return null;
    }

    const parsed = timezone
        ? createDateInTimezone(result.start, timezone)
        : result.start.date();

    return parsed && isValidDate(parsed) ? parsed : null;
}
