import { Events } from "discord.js";
import type { AnyEventDefinition, ClientEventName } from "../events";
import type { LoadResult } from "./moduleLoader";

/*
 * These aliases remain in ClientEvents for compatibility but are deprecated
 * in favour of clientReady and webhooksUpdate.
 */
const DEPRECATED_CLIENT_EVENT_NAMES = ["ready", "webhookUpdate"] as const;

const CLIENT_EVENT_NAMES = new Set<string>([
    ...Object.values(Events),
    ...DEPRECATED_CLIENT_EVENT_NAMES,
]);

type EventValidationResult =
    | {
          success: true;
          definition: AnyEventDefinition;
      }
    | {
          success: false;
          error: string;
      };

/**
 * Event definition resolved from a filesystem module.
 */
export interface ResolvedEventHandler {
    /**
     * Validated event definition.
     */
    definition: AnyEventDefinition;

    /**
     * Relative path of the defining module.
     */
    file: string;
}

/**
 * Result of converting imported modules into event handlers.
 */
export interface EventResolutionResponse {
    handlers: ResolvedEventHandler[];

    skipped: {
        file: string;
        reason: string;
    }[];

    failed: {
        file: string;
        error: string;
    }[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isClientEventName(value: unknown): value is ClientEventName {
    return typeof value === "string" && CLIENT_EVENT_NAMES.has(value);
}

function getEventCandidate(moduleExports: Record<string, unknown>): unknown {
    return moduleExports.default ?? moduleExports.event;
}

function validateEventDefinition(candidate: unknown): EventValidationResult {
    if (!isRecord(candidate)) {
        return {
            success: false,
            error: "The event export must be an object.",
        };
    }

    if (!isClientEventName(candidate.name)) {
        if (typeof candidate.name === "string") {
            return {
                success: false,
                error:
                    `"${candidate.name}" is not a supported ` +
                    "Discord client event.",
            };
        }

        return {
            success: false,
            error: 'The event export must declare a valid string "name".',
        };
    }

    if (candidate.once !== undefined && typeof candidate.once !== "boolean") {
        return {
            success: false,
            error: 'The optional "once" property must be a boolean.',
        };
    }

    if (typeof candidate.execute !== "function") {
        return {
            success: false,
            error: 'The event export must declare an "execute" function.',
        };
    }

    /*
     * All runtime fields have now been validated. The exact execute argument
     * tuple was checked statically when authored through defineEvent.
     */
    return {
        success: true,
        definition: candidate as unknown as AnyEventDefinition,
    };
}

/**
 * Converts dynamically imported modules into validated event handlers.
 *
 * A module may export its definition either as the default export or through
 * a named `event` export.
 *
 * Several handlers may target the same Discord event. Event names are
 * intentionally not treated as unique identifiers.
 */
export function resolveEventModules(
    modules: readonly LoadResult[],
): EventResolutionResponse {
    const response: EventResolutionResponse = {
        handlers: [],
        skipped: [],
        failed: [],
    };

    for (const loadedModule of modules) {
        const candidate = getEventCandidate(loadedModule.moduleExports);

        if (candidate === undefined) {
            response.skipped.push({
                file: loadedModule.relativePath,
                reason:
                    "Module does not export an event as " +
                    'default or as "event".',
            });

            continue;
        }

        const validation = validateEventDefinition(candidate);

        if (!validation.success) {
            response.failed.push({
                file: loadedModule.relativePath,
                error: validation.error,
            });

            continue;
        }

        response.handlers.push({
            definition: validation.definition,
            file: loadedModule.relativePath,
        });
    }

    response.handlers.sort((left, right) =>
        left.file.localeCompare(right.file),
    );

    return response;
}
