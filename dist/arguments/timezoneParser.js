import { distance } from "fastest-levenshtein";
import moment from "moment-timezone";
const MAX_INPUT_LENGTH = 80;
const MIN_PARTIAL_MATCH_LENGTH = 3;
const MIN_FUZZY_MATCH_LENGTH = 4;
const EXPLICIT_ALIASES = new Map([
    ["utc", "Etc/UTC"],
    ["z", "Etc/UTC"],
    ["gmt", "Etc/GMT"],
    // ["india", "Asia/Kolkata"],
    // ["kolkata", "Asia/Kolkata"],
]);
const normalizeTimezoneInput = (value) => {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase()
        .replace(/['’]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");
};
const getCityPart = (timezone) => {
    const parts = timezone.split("/");
    return parts[parts.length - 1] ?? timezone;
};
const chooseBestTimezoneName = (timezones) => {
    if (timezones.length === 0) {
        return null;
    }
    return ([...timezones].sort((a, b) => {
        if (a.length !== b.length) {
            return a.length - b.length;
        }
        return a.localeCompare(b);
    })[0] ?? null);
};
const getAllowedTypoDistance = (inputLength) => {
    if (inputLength < MIN_FUZZY_MATCH_LENGTH) {
        return 0;
    }
    if (inputLength <= 6) {
        return 1;
    }
    if (inputLength <= 10) {
        return 2;
    }
    return 3;
};
const isBetterCandidate = (current, next) => {
    if (!current) {
        return true;
    }
    if (next.score !== current.score) {
        return next.score < current.score;
    }
    return next.timezone.localeCompare(current.timezone) < 0;
};
const buildSingleZoneCountryMap = () => {
    const result = new Map();
    for (const countryCode of moment.tz.countries()) {
        const zones = moment.tz.zonesForCountry(countryCode) ?? [];
        const onlyZone = zones.length === 1 ? zones[0] : undefined;
        if (onlyZone) {
            result.set(countryCode.toLowerCase(), onlyZone);
        }
    }
    return result;
};
const TIMEZONE_INDEX = moment.tz.names().map((name) => ({
    name,
    normalizedName: normalizeTimezoneInput(name),
    normalizedCity: normalizeTimezoneInput(getCityPart(name)),
}));
const TIMEZONE_BY_NORMALIZED_NAME = new Map();
const TIMEZONES_BY_NORMALIZED_CITY = new Map();
const SINGLE_ZONE_COUNTRY_BY_CODE = buildSingleZoneCountryMap();
for (const timezone of TIMEZONE_INDEX) {
    TIMEZONE_BY_NORMALIZED_NAME.set(timezone.normalizedName, timezone.name);
    const existingCityMatches = TIMEZONES_BY_NORMALIZED_CITY.get(timezone.normalizedCity) ?? [];
    existingCityMatches.push(timezone.name);
    TIMEZONES_BY_NORMALIZED_CITY.set(timezone.normalizedCity, existingCityMatches);
}
export const resolveTimezone = (input) => {
    const trimmed = input.trim();
    if (!trimmed || trimmed.length > MAX_INPUT_LENGTH) {
        return null;
    }
    /**
     * Fast path for valid exact IANA names.
     * Example: Asia/Kolkata
     */
    const directZone = moment.tz.zone(trimmed);
    if (directZone) {
        return directZone.name;
    }
    const normalizedInput = normalizeTimezoneInput(trimmed);
    if (!normalizedInput) {
        return null;
    }
    /**
     * Explicit aliases.
     * Example: UTC -> Etc/UTC
     */
    const aliasMatch = EXPLICIT_ALIASES.get(normalizedInput);
    if (aliasMatch && moment.tz.zone(aliasMatch)) {
        return aliasMatch;
    }
    /**
     * Case-insensitive / separator-insensitive IANA match.
     * Examples:
     * - asia kolkata -> Asia/Kolkata
     * - america new york -> America/New_York
     */
    const exactNameMatch = TIMEZONE_BY_NORMALIZED_NAME.get(normalizedInput);
    if (exactNameMatch) {
        return exactNameMatch;
    }
    /**
     * ISO country code support, but only when the country has exactly one timezone.
     * Examples:
     * - IN -> Asia/Kolkata
     * - SG -> Asia/Singapore
     *
     * Avoids unsafe guesses for countries like US, CA, AU, etc.
     */
    if (normalizedInput.length === 2) {
        const countryMatch = SINGLE_ZONE_COUNTRY_BY_CODE.get(normalizedInput);
        if (countryMatch) {
            return countryMatch;
        }
    }
    /**
     * Exact city match.
     * Examples:
     * - kolkata -> Asia/Kolkata
     * - new york -> America/New_York
     */
    const exactCityMatches = TIMEZONES_BY_NORMALIZED_CITY.get(normalizedInput) ?? [];
    const exactCityMatch = chooseBestTimezoneName(exactCityMatches);
    if (exactCityMatch) {
        return exactCityMatch;
    }
    let bestCandidate = null;
    for (const timezone of TIMEZONE_INDEX) {
        /**
         * Partial city match.
         * Examples:
         * - kolk -> Asia/Kolkata
         * - angeles -> America/Los_Angeles
         */
        if (normalizedInput.length >= MIN_PARTIAL_MATCH_LENGTH) {
            if (timezone.normalizedCity.startsWith(normalizedInput)) {
                const candidate = {
                    timezone: timezone.name,
                    score: 10 + timezone.normalizedCity.length,
                };
                if (isBetterCandidate(bestCandidate, candidate)) {
                    bestCandidate = candidate;
                }
                continue;
            }
            if (timezone.normalizedCity.includes(normalizedInput)) {
                const candidate = {
                    timezone: timezone.name,
                    score: 20 + timezone.normalizedCity.length,
                };
                if (isBetterCandidate(bestCandidate, candidate)) {
                    bestCandidate = candidate;
                }
                continue;
            }
            /**
             * Partial full-name match.
             * Useful for inputs like:
             * - asia kol -> Asia/Kolkata
             * - america new -> America/New_York
             */
            if (normalizedInput.includes("_") &&
                timezone.normalizedName.includes(normalizedInput)) {
                const candidate = {
                    timezone: timezone.name,
                    score: 30 + timezone.normalizedName.length,
                };
                if (isBetterCandidate(bestCandidate, candidate)) {
                    bestCandidate = candidate;
                }
                continue;
            }
        }
        /**
         * Fuzzy city match.
         * Examples:
         * - kolkta -> Asia/Kolkata
         * - londn -> Europe/London
         */
        if (normalizedInput.length >= MIN_FUZZY_MATCH_LENGTH) {
            const maxDistance = getAllowedTypoDistance(normalizedInput.length);
            const typoDistance = distance(normalizedInput, timezone.normalizedCity);
            if (typoDistance <= maxDistance) {
                const candidate = {
                    timezone: timezone.name,
                    score: 100 +
                        typoDistance * 10 +
                        Math.abs(timezone.normalizedCity.length -
                            normalizedInput.length),
                };
                if (isBetterCandidate(bestCandidate, candidate)) {
                    bestCandidate = candidate;
                }
            }
        }
    }
    return bestCandidate?.timezone ?? null;
};
//# sourceMappingURL=timezoneParser.js.map