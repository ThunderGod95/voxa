import * as chrono from "chrono-node";
import moment from "moment-timezone";
import { resolveTimezone } from "./timezoneParser";
function isValidDate(value) {
    return !Number.isNaN(value.getTime());
}
function getRequiredComponent(components, name) {
    return components.get(name);
}
/**
 * Reconstructs Chrono's parsed wall-clock components inside an IANA timezone.
 *
 * This is intentionally not implemented by attaching the reference date's
 * UTC offset to the result. The target date may have a different offset due
 * to daylight-saving transitions.
 */
function createDateInTimezone(components, timezone) {
    const year = getRequiredComponent(components, "year");
    const month = getRequiredComponent(components, "month");
    const day = getRequiredComponent(components, "day");
    const hour = getRequiredComponent(components, "hour");
    const minute = getRequiredComponent(components, "minute");
    const second = getRequiredComponent(components, "second");
    const millisecond = getRequiredComponent(components, "millisecond");
    if (year === null ||
        month === null ||
        day === null ||
        hour === null ||
        minute === null ||
        second === null ||
        millisecond === null) {
        return null;
    }
    const parsed = moment.tz({
        year,
        month: month - 1,
        day,
        hour,
        minute,
        second,
        millisecond,
    }, timezone);
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
export function parseNaturalTime(input, options = {}) {
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
    const parsingReference = timezone
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
//# sourceMappingURL=timeParser.js.map