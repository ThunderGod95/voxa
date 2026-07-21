# Repository Metadata
- **Project:** voxa
- **Generated:** 2026-07-21T18:22:43.830Z
- **Files:** 30

---

# Repository Structure
```text
voxa
├── .gitignore
├── biome.json
├── package.json
├─┬ src
│ ├─┬ arguments
│ │ ├── builder.ts
│ │ ├── index.ts
│ │ ├── interactionParser.ts
│ │ ├── messageParser.ts
│ │ ├── tokenizer.ts
│ │ ├── types.ts
│ │ └── utils.ts
│ ├─┬ context
│ │ ├── context.ts
│ │ ├── feedback.ts
│ │ ├── index.ts
│ │ ├── logger.ts
│ │ ├── reply.ts
│ │ ├── responder.ts
│ │ └── source.ts
│ ├── index.ts
│ ├─┬ loader
│ │ ├── index.ts
│ │ └── moduleLoader.ts
│ ├── manager.ts
│ └── resolvers.ts
├─┬ tests
│ ├─┬ arguments
│ │ ├── builder.test.ts
│ │ ├── interactionParser.test.ts
│ │ ├── messageParser.test.ts
│ │ ├── tokenizer.test.ts
│ │ └── utils.test.ts
│ ├── context.test.ts
│ └── manager.test.ts
└── tsconfig.json
```

---

# Repository Files

### File: .gitignore

```
# dependencies (bun install)
node_modules

# output
out
dist
*.tgz

# code coverage
coverage
*.lcov

# logs
logs
_.log
report.[0-9]_.[0-9]_.[0-9]_.[0-9]_.json

# dotenv environment variable files
.env
.env.development.local
.env.test.local
.env.production.local
.env.local

# caches
.eslintcache
.cache
*.tsbuildinfo

# IntelliJ based IDEs
.idea

# Finder (MacOS) folder config
.DS_Store

```

### File: biome.json

```
{
    "$schema": "https://biomejs.dev/schemas/2.5.4/schema.json",
    "vcs": {
        "enabled": true,
        "clientKind": "git",
        "useIgnoreFile": true
    },
    "files": {
        "ignoreUnknown": false
    },
    "formatter": {
        "enabled": true,
        "indentStyle": "tab"
    },
    "linter": {
        "enabled": true,
        "rules": {
            "preset": "recommended"
        }
    },
    "javascript": {
        "formatter": {
            "quoteStyle": "double",
            "semicolons": "always"
        }
    },
    "assist": {
        "enabled": true,
        "actions": {
            "source": {
                "organizeImports": "on"
            }
        }
    }
}

```

### File: package.json

```
{
    "name": "voxa",
    "module": "index.ts",
    "type": "module",
    "private": true,
    "main": "src/index.ts",
    "scripts": {
        "test": "bun test",
        "check": "biome check src tests",
        "format": "biome format --write src tests",
        "lint": "biome lint --write src tests"
    },
    "devDependencies": {
        "@biomejs/biome": "latest",
        "@types/bun": "latest"
    },
    "peerDependencies": {
        "discord.js": "^14.27.0",
        "typescript": "^5"
    },
    "dependencies": {
        "fastest-levenshtein": "^1.0.16",
        "zod": "^4.4.3"
    }
}

```

### File: src/arguments/builder.ts

```
import type { GuildMember, Role, User } from "discord.js";
import { z } from "zod";
import type {
    BooleanArgumentDefinition,
    BooleanArgumentOptions,
    IntegerArgumentDefinition,
    IntegerArgumentOptions,
    MemberArgumentDefinition,
    MemberArgumentOptions,
    NumberArgumentDefinition,
    NumberArgumentOptions,
    RoleArgumentDefinition,
    RoleArgumentOptions,
    StringArgumentDefinition,
    StringArgumentOptions,
    UrlArgumentDefinition,
    UrlArgumentOptions,
    UserArgumentDefinition,
    UserArgumentOptions,
} from "./types";

function requiredValue<Required extends boolean>(
    required: Required | undefined,
): Required {
    return (required ?? false) as Required;
}

function restValue(rest: boolean | undefined): boolean {
    return rest ?? false;
}

function applyRequired<Output, Required extends boolean>(
    schema: z.ZodType<Output>,
    required: Required,
): z.ZodType<Required extends true ? Output : Output | null> {
    return (required ? schema : schema.nullable()) as z.ZodType<
        Required extends true ? Output : Output | null
    >;
}

/**
 * Factory object for creating strongly-typed command argument definitions.
 */
export const argument = {
    /** Constructs a string argument definition. */
    string<const Required extends boolean = false>(
        options: StringArgumentOptions<Required>,
    ): StringArgumentDefinition<Required> {
        let schema = z.string({
            error: "Must be a string.",
        });

        if (options.minLength !== undefined) {
            schema = schema.min(options.minLength, {
                message: `Must contain at least ${options.minLength} characters.`,
            });
        }

        if (options.maxLength !== undefined) {
            schema = schema.max(options.maxLength, {
                message: `Cannot contain more than ${options.maxLength} characters.`,
            });
        }

        const isRequired = requiredValue(options.required);
        const finalSchema = applyRequired(schema, isRequired);

        return {
            type: "string",
            description: options.description,
            required: isRequired,
            rest: restValue(options.rest),
            minLength: options.minLength,
            maxLength: options.maxLength,
            _schema: finalSchema,
        };
    },

    /** Constructs an integer argument definition. Input is coerced automatically. */
    integer<const Required extends boolean = false>(
        options: IntegerArgumentOptions<Required>,
    ): IntegerArgumentDefinition<Required> {
        let numberSchema = z
            .number({ error: "Must be a valid number." })
            .int({ message: "Must be a whole number." });

        if (options.min !== undefined) {
            numberSchema = numberSchema.min(options.min, {
                message: `Must be at least ${options.min}.`,
            });
        }

        if (options.max !== undefined) {
            numberSchema = numberSchema.max(options.max, {
                message: `Cannot be more than ${options.max}.`,
            });
        }

        const schema = z.preprocess((val) => {
            if (typeof val === "number") return val;
            if (typeof val === "string" && /^[+-]?\d+$/u.test(val.trim())) {
                return Number(val);
            }
            return val;
        }, numberSchema);

        const isRequired = requiredValue(options.required);
        const finalSchema = applyRequired(schema, isRequired);

        return {
            type: "integer",
            description: options.description,
            required: isRequired,
            rest: restValue(options.rest),
            min: options.min,
            max: options.max,
            _schema: finalSchema,
        };
    },

    /** Constructs a floating-point number argument definition. */
    number<const Required extends boolean = false>(
        options: NumberArgumentOptions<Required>,
    ): NumberArgumentDefinition<Required> {
        let numberSchema = z.number({
            error: "Must be a valid number.",
        });

        if (options.min !== undefined) {
            numberSchema = numberSchema.min(options.min, {
                message: `Must be at least ${options.min}.`,
            });
        }

        if (options.max !== undefined) {
            numberSchema = numberSchema.max(options.max, {
                message: `Cannot be more than ${options.max}.`,
            });
        }

        const schema = z.preprocess((val) => {
            if (typeof val === "number") return val;
            if (typeof val === "string" && val.trim().length > 0) {
                const parsed = Number(val);
                if (!Number.isNaN(parsed)) return parsed;
            }
            return val;
        }, numberSchema);

        const isRequired = requiredValue(options.required);
        const finalSchema = applyRequired(schema, isRequired);

        return {
            type: "number",
            description: options.description,
            required: isRequired,
            rest: restValue(options.rest),
            min: options.min,
            max: options.max,
            _schema: finalSchema,
        };
    },

    /** Constructs a boolean argument. Accepts various truthy/falsy string representations. */
    boolean<const Required extends boolean = false>(
        options: BooleanArgumentOptions<Required>,
    ): BooleanArgumentDefinition<Required> {
        const trueValues = ["true", "yes", "y", "1", "on", "enable", "enabled"];
        const falseValues = [
            "false",
            "no",
            "n",
            "0",
            "off",
            "disable",
            "disabled",
        ];

        const schema = z.preprocess(
            (val) => {
                if (typeof val === "boolean") return val;
                if (typeof val === "string") {
                    const normalized = val.toLowerCase().trim();
                    if (trueValues.includes(normalized)) return true;
                    if (falseValues.includes(normalized)) return false;
                }
                return val;
            },
            z.boolean({ error: "Must be true or false." }),
        );

        const isRequired = requiredValue(options.required);
        const finalSchema = applyRequired(schema, isRequired);

        return {
            type: "boolean",
            description: options.description,
            required: isRequired,
            rest: restValue(options.rest),
            _schema: finalSchema,
        };
    },

    /** Constructs a Discord User argument definition. */
    user<const Required extends boolean = false>(
        options: UserArgumentOptions<Required>,
    ): UserArgumentDefinition<Required> {
        const schema = z.custom<User>(
            (val) => val !== null && typeof val === "object" && "id" in val,
            { message: "Could not resolve a valid user." },
        );

        const isRequired = requiredValue(options.required);
        const finalSchema = applyRequired(schema, isRequired);

        return {
            type: "user",
            description: options.description,
            required: isRequired,
            rest: restValue(options.rest),
            _schema: finalSchema,
        };
    },

    /** Constructs a Discord GuildMember argument definition. */
    member<const Required extends boolean = false>(
        options: MemberArgumentOptions<Required>,
    ): MemberArgumentDefinition<Required> {
        const schema = z.custom<GuildMember>(
            (val) => val !== null && typeof val === "object" && "user" in val,
            { message: "Could not resolve a valid server member." },
        );

        const isRequired = requiredValue(options.required);
        const finalSchema = applyRequired(schema, isRequired);

        return {
            type: "member",
            description: options.description,
            required: isRequired,
            rest: restValue(options.rest),
            _schema: finalSchema,
        };
    },

    /** Constructs a Discord Role argument definition. */
    role<const Required extends boolean = false>(
        options: RoleArgumentOptions<Required>,
    ): RoleArgumentDefinition<Required> {
        const schema = z.custom<Role>(
            (val) => val !== null && typeof val === "object" && "name" in val,
            { message: "Could not resolve a valid role." },
        );

        const isRequired = requiredValue(options.required);
        const finalSchema = applyRequired(schema, isRequired);

        return {
            type: "role",
            description: options.description,
            required: isRequired,
            rest: restValue(options.rest),
            ...(options.allowedRoleIds !== undefined
                ? { allowedRoleIds: options.allowedRoleIds }
                : {}),
            _schema: finalSchema,
        };
    },

    url<const Required extends boolean = false>(
        options: UrlArgumentOptions<Required>,
    ): UrlArgumentDefinition<Required> {
        const schema = z
            .url({
                pattern: options.pattern,
                hostname: options.hostname,
                protocol: options.protocol,
                error: "Must be a valid URL.",
            })
            .transform((value) => new URL(value));

        const isRequired = requiredValue(options.required);
        const finalSchema = applyRequired(schema, isRequired);

        return {
            type: "url",
            description: options.description,
            required: isRequired,
            rest: restValue(options.rest),
            pattern: options.pattern,
            hostname: options.hostname,
            protocol: options.protocol,
            _schema: finalSchema,
        };
    },
};

```

### File: src/arguments/index.ts

```
export * from "./builder";
export * from "./interactionParser";
export * from "./messageParser";
export * from "./tokenizer";
export * from "./types";
export * from "./utils";

```

### File: src/arguments/interactionParser.ts

```
import type { ChatInputCommandInteraction } from "discord.js";
import type {
    ArgumentParseResult,
    ArgumentSchema,
    CommandArgumentDefinition,
    ParsedArguments,
    ResolutionResult,
} from "./types";

/**
 * Resolves interaction options from Discord's interaction payload based on the definition type.
 */
async function resolveInteractionValue(
    name: string,
    definition: CommandArgumentDefinition,
    interaction: ChatInputCommandInteraction,
): Promise<ResolutionResult<unknown>> {
    let rawValue: unknown = null;

    switch (definition.type) {
        case "string":
            rawValue = interaction.options.getString(name);
            break;
        case "url":
            rawValue = interaction.options.getString(name);
            break;
        case "integer":
            rawValue = interaction.options.getInteger(name);
            break;
        case "number":
            rawValue = interaction.options.getNumber(name);
            break;
        case "boolean":
            rawValue = interaction.options.getBoolean(name);
            break;
        case "user":
            rawValue = interaction.options.getUser(name);
            break;
        case "member": {
            const user = interaction.options.getUser(name);
            if (user) {
                if (!interaction.guild) {
                    return {
                        success: false,
                        code: "INVALID_ARGUMENT",
                        message: `\`${name}\` can only be used in a server.`,
                    };
                }
                const member = await interaction.guild.members
                    .fetch(user.id)
                    .catch(() => null);
                if (!member) {
                    return {
                        success: false,
                        code: "ARGUMENT_NOT_FOUND",
                        message: "That user is not a member of this server.",
                    };
                }
                rawValue = member;
            }
            break;
        }
        case "role": {
            const role = interaction.options.getRole(name);
            if (role) {
                if (!interaction.guild) {
                    return {
                        success: false,
                        code: "INVALID_ARGUMENT",
                        message: `\`${name}\` can only be used in a server.`,
                    };
                }
                if (
                    definition.allowedRoleIds &&
                    !definition.allowedRoleIds.includes(role.id)
                ) {
                    return {
                        success: false,
                        code: "INVALID_ARGUMENT",
                        message: `The selected role is not allowed for \`${name}\`.`,
                    };
                }
                const fetchedRole = await interaction.guild.roles
                    .fetch(role.id)
                    .catch(() => null);
                if (!fetchedRole) {
                    return {
                        success: false,
                        code: "ARGUMENT_NOT_FOUND",
                        message: "Could not find the selected role.",
                    };
                }
                rawValue = fetchedRole;
            }
            break;
        }
    }

    if (rawValue === null) {
        return { success: true, value: null };
    }

    const validation = await definition._schema.safeParseAsync(rawValue);

    if (!validation.success) {
        return {
            success: false,
            code: "INVALID_ARGUMENT",
            message: `\`${name}\`: ${validation.error.issues[0]?.message ?? "Invalid argument."}`,
        };
    }

    return { success: true, value: validation.data };
}

/**
 * Validates and maps a Discord interaction payload against the provided schema.
 *
 * @param schema - The ArgumentSchema structure for the command.
 * @param interaction - The ChatInputCommandInteraction from Discord.
 * @returns A result object containing the mapped arguments or an error.
 */
export async function parseInteractionArguments<Schema extends ArgumentSchema>(
    schema: Schema,
    interaction: ChatInputCommandInteraction,
): Promise<ArgumentParseResult<ParsedArguments<Schema>>> {
    const parsed: Record<string, unknown> = {};

    for (const [name, definition] of Object.entries(schema)) {
        const resolved = await resolveInteractionValue(
            name,
            definition,
            interaction,
        );

        if (!resolved.success) {
            return {
                success: false,
                error: {
                    code: resolved.code,
                    argument: name,
                    message: resolved.message,
                },
            };
        }

        if (resolved.value === null && definition.required) {
            return {
                success: false,
                error: {
                    code: "MISSING_ARGUMENT",
                    argument: name,
                    message: `Missing required argument: \`${name}\`.`,
                },
            };
        }

        parsed[name] = resolved.value;
    }

    return {
        success: true,
        value: parsed as ParsedArguments<Schema>,
    };
}

```

### File: src/arguments/messageParser.ts

```
import type { Message } from "discord.js";
import { getRoleFromInput, getUserFromInput } from "../resolvers";
import type {
    ArgumentParseResult,
    ArgumentSchema,
    CommandArgumentDefinition,
    ParsedArguments,
    ResolutionResult,
} from "./types";

/**
 * Resolves a single raw string token into its target type (User, Role, etc) via a Message context.
 */
async function resolveMessageValue(
    name: string,
    definition: CommandArgumentDefinition,
    input: string,
    message: Message,
): Promise<ResolutionResult<unknown>> {
    let rawValue: unknown = input;

    switch (definition.type) {
        case "user": {
            const user = await getUserFromInput(input, message);
            if (!user) {
                return {
                    success: false,
                    code: "ARGUMENT_NOT_FOUND",
                    message: `Could not find a user for \`${name}\`.`,
                };
            }
            rawValue = user;
            break;
        }

        case "member": {
            if (!message.guild) {
                return {
                    success: false,
                    code: "INVALID_ARGUMENT",
                    message: `\`${name}\` can only be used in a server.`,
                };
            }
            const user = await getUserFromInput(input, message);
            if (!user) {
                return {
                    success: false,
                    code: "ARGUMENT_NOT_FOUND",
                    message: `Could not find a member for \`${name}\`.`,
                };
            }
            const member = await message.guild.members
                .fetch(user.id)
                .catch(() => null);
            if (!member) {
                return {
                    success: false,
                    code: "ARGUMENT_NOT_FOUND",
                    message: "That user is not a member of this server.",
                };
            }
            rawValue = member;
            break;
        }

        case "role": {
            if (!message.guild) {
                return {
                    success: false,
                    code: "INVALID_ARGUMENT",
                    message: `\`${name}\` can only be used in a server.`,
                };
            }
            const role = getRoleFromInput(
                input,
                message.guild,
                definition.allowedRoleIds,
            );
            if (!role) {
                return {
                    success: false,
                    code: "ARGUMENT_NOT_FOUND",
                    message: `Could not find a role for \`${name}\`.`,
                };
            }
            rawValue = role;
            break;
        }
    }

    const validation = await definition._schema.safeParseAsync(rawValue);

    if (!validation.success) {
        return {
            success: false,
            code: "INVALID_ARGUMENT",
            message: `\`${name}\`: ${validation.error.issues[0]?.message ?? "Invalid argument."}`,
        };
    }

    return { success: true, value: validation.data };
}

/**
 * Parses and maps a sequence of tokenized string arguments against a defined schema.
 *
 * @param schema - The ArgumentSchema structure for the command.
 * @param message - The Discord Message that triggered the command.
 * @param tokens - An array of raw string tokens extracted from the message.
 * @returns A result object containing the validated, strongly-typed arguments or an error.
 */
export async function parseMessageArguments<Schema extends ArgumentSchema>(
    schema: Schema,
    message: Message,
    tokens: readonly string[],
): Promise<ArgumentParseResult<ParsedArguments<Schema>>> {
    const parsed: Record<string, unknown> = {};
    let tokenIndex = 0;

    for (const [name, definition] of Object.entries(schema)) {
        const input = definition.rest
            ? tokenIndex < tokens.length
                ? tokens.slice(tokenIndex).join(" ")
                : undefined
            : tokens[tokenIndex];

        if (definition.rest) {
            tokenIndex = tokens.length;
        } else if (input !== undefined) {
            tokenIndex++;
        }

        if (input === undefined) {
            if (definition.required) {
                return {
                    success: false,
                    error: {
                        code: "MISSING_ARGUMENT",
                        argument: name,
                        message: `Missing required argument: \`${name}\`.`,
                    },
                };
            }

            parsed[name] = null;
            continue;
        }

        const resolved = await resolveMessageValue(
            name,
            definition,
            input,
            message,
        );

        if (!resolved.success) {
            return {
                success: false,
                error: {
                    code: resolved.code,
                    argument: name,
                    message: resolved.message,
                },
            };
        }

        parsed[name] = resolved.value;
    }

    if (tokenIndex < tokens.length) {
        return {
            success: false,
            error: {
                code: "TOO_MANY_ARGUMENTS",
                message: "Too many arguments were provided.",
            },
        };
    }

    return {
        success: true,
        value: parsed as ParsedArguments<Schema>,
    };
}

```

### File: src/arguments/tokenizer.ts

```
import type { TokenizeResult } from "./types";

/**
 * Parses a raw command string into individual argument tokens, respecting quotes and escapes.
 *
 * @param input - The raw string following the command name.
 * @returns A TokenizeResult containing the extracted tokens or a syntax error.
 */
export function tokenizeArguments(input: string): TokenizeResult {
    const tokens: string[] = [];

    let current = "";
    let quote: '"' | "'" | null = null;
    let escaped = false;
    let tokenStarted = false;

    for (const character of input) {
        if (escaped) {
            current += character;
            escaped = false;
            tokenStarted = true;
            continue;
        }

        if (character === "\\") {
            escaped = true;
            tokenStarted = true;
            continue;
        }

        if (quote) {
            if (character === quote) {
                quote = null;
            } else {
                current += character;
            }
            continue;
        }

        if (character === '"' || character === "'") {
            quote = character;
            tokenStarted = true;
            continue;
        }

        if (/\s/u.test(character)) {
            if (tokenStarted) {
                tokens.push(current);
                current = "";
                tokenStarted = false;
            }
            continue;
        }

        current += character;
        tokenStarted = true;
    }

    if (escaped) {
        current += "\\";
    }

    if (quote) {
        return {
            success: false,
            error: {
                code: "INVALID_SYNTAX",
                message: "An argument has an unterminated quote.",
            },
        };
    }

    if (tokenStarted) {
        tokens.push(current);
    }

    return {
        success: true,
        tokens,
    };
}

```

### File: src/arguments/types.ts

```
import type { GuildMember, Role, User } from "discord.js";
import type { z } from "zod";

/** Base configuration available to all argument types. */
export interface BaseArgumentOptions<Required extends boolean> {
    /** The description of the argument, shown in slash commands and help menus. */
    description: string;
    /** Whether this argument must be provided by the user. */
    required?: Required;
    /**
     * For prefix commands, consumes all remaining tokens into this single argument.
     * A rest argument must be the final argument in the schema.
     */
    rest?: boolean;
}

/** Internal representation of a parsed argument definition. */
export interface BaseArgumentDefinition<
    Type extends string,
    Required extends boolean,
    TOutput,
> {
    type: Type;
    description: string;
    required: Required;
    rest: boolean;
    /** @internal Private Zod schema for runtime validation and type inference */
    _schema: z.ZodType<TOutput>;
}

export interface StringArgumentOptions<
    Required extends boolean = false,
> extends BaseArgumentOptions<Required> {
    minLength?: number;
    maxLength?: number;
}

export interface StringArgumentDefinition<
    Required extends boolean = false,
> extends BaseArgumentDefinition<
    "string",
    Required,
    Required extends true ? string : string | null
> {
    minLength?: number;
    maxLength?: number;
}

export interface IntegerArgumentOptions<
    Required extends boolean = false,
> extends BaseArgumentOptions<Required> {
    min?: number;
    max?: number;
}

export interface IntegerArgumentDefinition<
    Required extends boolean = false,
> extends BaseArgumentDefinition<
    "integer",
    Required,
    Required extends true ? number : number | null
> {
    min?: number;
    max?: number;
}

export interface NumberArgumentOptions<
    Required extends boolean = false,
> extends BaseArgumentOptions<Required> {
    min?: number;
    max?: number;
}

export interface NumberArgumentDefinition<
    Required extends boolean = false,
> extends BaseArgumentDefinition<
    "number",
    Required,
    Required extends true ? number : number | null
> {
    min?: number;
    max?: number;
}

export type BooleanArgumentOptions<Required extends boolean = false> =
    BaseArgumentOptions<Required>;

export type BooleanArgumentDefinition<Required extends boolean = false> =
    BaseArgumentDefinition<
        "boolean",
        Required,
        Required extends true ? boolean : boolean | null
    >;

export type UserArgumentOptions<Required extends boolean = false> =
    BaseArgumentOptions<Required>;

export type UserArgumentDefinition<Required extends boolean = false> =
    BaseArgumentDefinition<
        "user",
        Required,
        Required extends true ? User : User | null
    >;

export type MemberArgumentOptions<Required extends boolean = false> =
    BaseArgumentOptions<Required>;

export type MemberArgumentDefinition<Required extends boolean = false> =
    BaseArgumentDefinition<
        "member",
        Required,
        Required extends true ? GuildMember : GuildMember | null
    >;

export interface RoleArgumentOptions<
    Required extends boolean = false,
> extends BaseArgumentOptions<Required> {
    allowedRoleIds?: readonly string[];
}

export interface RoleArgumentDefinition<
    Required extends boolean = false,
> extends BaseArgumentDefinition<
    "role",
    Required,
    Required extends true ? Role : Role | null
> {
    allowedRoleIds?: readonly string[];
}

export interface UrlArgumentOptions<
    Required extends boolean = false,
> extends BaseArgumentOptions<Required> {
    pattern?: RegExp;
    hostname?: RegExp;
    protocol?: RegExp;
}

export interface UrlArgumentDefinition<
    Required extends boolean = false,
> extends BaseArgumentDefinition<
    "url",
    Required,
    Required extends true ? URL : URL | null
> {
    pattern?: RegExp;
    hostname?: RegExp;
    protocol?: RegExp;
}

export type CommandArgumentDefinition =
    | StringArgumentDefinition<boolean>
    | IntegerArgumentDefinition<boolean>
    | NumberArgumentDefinition<boolean>
    | BooleanArgumentDefinition<boolean>
    | UserArgumentDefinition<boolean>
    | MemberArgumentDefinition<boolean>
    | RoleArgumentDefinition<boolean>
    | UrlArgumentDefinition<boolean>;

/** A collection of argument definitions that make up a command's structure. */
export type ArgumentSchema = Readonly<
    Record<string, CommandArgumentDefinition>
>;

/** Infers the final output types from a given ArgumentSchema. */
export type ParsedArguments<Schema extends ArgumentSchema> = {
    [Name in keyof Schema]: Schema[Name] extends {
        _schema: z.ZodType<infer TOutput>;
    }
        ? TOutput
        : never;
};

export type ArgumentErrorCode =
    | "INVALID_SYNTAX"
    | "MISSING_ARGUMENT"
    | "INVALID_ARGUMENT"
    | "ARGUMENT_NOT_FOUND"
    | "ARGUMENT_OUT_OF_RANGE"
    | "TOO_MANY_ARGUMENTS";

export interface ArgumentParseError {
    code: ArgumentErrorCode;
    argument?: string;
    message: string;
}

export type ArgumentParseResult<Value> =
    | { success: true; value: Value }
    | { success: false; error: ArgumentParseError };

export type TokenizeResult =
    | { success: true; tokens: string[] }
    | { success: false; error: ArgumentParseError };

export type ResolutionResult<Value> =
    | { success: true; value: Value }
    | { success: false; code: ArgumentErrorCode; message: string };

```

### File: src/arguments/utils.ts

```
import type { SlashCommandBuilder } from "discord.js";
import type { ArgumentSchema } from "./types";

/**
 * Mutates a SlashCommandBuilder by automatically appending options derived from an ArgumentSchema.
 *
 * @param builder - The Discord.js SlashCommandBuilder instance.
 * @param schema - The schema defining the command's arguments.
 */
export function addArgumentsToSlashCommand(
    builder: SlashCommandBuilder,
    schema: ArgumentSchema,
): void {
    for (const [name, definition] of Object.entries(schema)) {
        switch (definition.type) {
            case "string":
                builder.addStringOption((option) => {
                    option
                        .setName(name)
                        .setDescription(definition.description)
                        .setRequired(definition.required);
                    if (definition.minLength !== undefined)
                        option.setMinLength(definition.minLength);
                    if (definition.maxLength !== undefined)
                        option.setMaxLength(definition.maxLength);
                    return option;
                });
                break;

            case "url":
                builder.addStringOption((option) =>
                    option
                        .setName(name)
                        .setDescription(definition.description)
                        .setRequired(definition.required),
                );
                break;

            case "integer":
                builder.addIntegerOption((option) => {
                    option
                        .setName(name)
                        .setDescription(definition.description)
                        .setRequired(definition.required);
                    if (definition.min !== undefined)
                        option.setMinValue(definition.min);
                    if (definition.max !== undefined)
                        option.setMaxValue(definition.max);
                    return option;
                });
                break;

            case "number":
                builder.addNumberOption((option) => {
                    option
                        .setName(name)
                        .setDescription(definition.description)
                        .setRequired(definition.required);
                    if (definition.min !== undefined)
                        option.setMinValue(definition.min);
                    if (definition.max !== undefined)
                        option.setMaxValue(definition.max);
                    return option;
                });
                break;

            case "boolean":
                builder.addBooleanOption((option) =>
                    option
                        .setName(name)
                        .setDescription(definition.description)
                        .setRequired(definition.required),
                );
                break;

            case "user":
            case "member":
                builder.addUserOption((option) =>
                    option
                        .setName(name)
                        .setDescription(definition.description)
                        .setRequired(definition.required),
                );
                break;

            case "role":
                builder.addRoleOption((option) =>
                    option
                        .setName(name)
                        .setDescription(definition.description)
                        .setRequired(definition.required),
                );
                break;
        }
    }
}

/**
 * Asserts the validity of an ArgumentSchema at boot-time.
 * Throws an Error if logical constraints (e.g., ordering, limits) are violated.
 *
 * @param commandName - The name of the command (used for error tracing).
 * @param schema - The schema to validate.
 */
export function validateArgumentSchema(
    commandName: string,
    schema: ArgumentSchema,
): void {
    const entries = Object.entries(schema);
    let foundOptional = false;
    let foundRest = false;

    if (entries.length > 25) {
        throw new Error(
            `Command "${commandName}" cannot have more than 25 arguments.`,
        );
    }

    for (const [name, definition] of entries) {
        if (!/^[a-z0-9_-]{1,32}$/u.test(name)) {
            throw new Error(
                `Command "${commandName}" has an invalid argument name: "${name}".`,
            );
        }

        if (
            definition.description.length < 1 ||
            definition.description.length > 100
        ) {
            throw new Error(
                `Argument "${name}" in command "${commandName}" must have a description between 1 and 100 characters.`,
            );
        }

        if (foundRest) {
            throw new Error(
                `Argument "${name}" cannot appear after a rest argument in command "${commandName}".`,
            );
        }

        if (definition.rest) {
            foundRest = true;
        }

        if (definition.required) {
            if (foundOptional) {
                throw new Error(
                    `Required argument "${name}" cannot appear after an optional argument in command "${commandName}".`,
                );
            }
        } else {
            foundOptional = true;
        }

        if (
            definition.type === "string" &&
            definition.minLength !== undefined &&
            definition.maxLength !== undefined &&
            definition.minLength > definition.maxLength
        ) {
            throw new Error(
                `Argument "${name}" in command "${commandName}" has minLength greater than maxLength.`,
            );
        }

        if (
            (definition.type === "integer" || definition.type === "number") &&
            definition.min !== undefined &&
            definition.max !== undefined &&
            definition.min > definition.max
        ) {
            throw new Error(
                `Argument "${name}" in command "${commandName}" has min greater than max.`,
            );
        }
    }
}

/**
 * Generates a human-readable usage string from an ArgumentSchema.
 * Example format: `<required_arg> [optional_arg] [rest_arg...]`
 *
 * @param schema - The schema to format.
 * @returns Formatted usage string.
 */
export function formatArgumentUsage(schema: ArgumentSchema): string {
    return Object.entries(schema)
        .map(([name, definition]) => {
            const label = definition.rest ? `${name}...` : name;
            return definition.required ? `<${label}>` : `[${label}]`;
        })
        .join(" ");
}

```

### File: src/context/context.ts

```
import type {
    ChatInputCommandInteraction,
    Guild,
    GuildMember,
    Message,
    User,
} from "discord.js";
import {
    type CommandFeedbackRenderer,
    defaultCommandFeedbackRenderer,
} from "./feedback";
import { type CommandLogger, defaultCommandLogger } from "./logger";
import type { CommandReplyPayload } from "./reply";
import { type CommandResponder, createCommandResponder } from "./responder";
import {
    CommandInvocation,
    type CommandPayload,
    createCommandSource,
} from "./source";

export interface CommandContextOptions {
    logger?: CommandLogger;
    feedbackRenderer?: CommandFeedbackRenderer;
}

export class CommandContext<Arguments extends object = Record<string, never>> {
    public readonly args: Arguments;

    private readonly invocation: CommandInvocation;
    private readonly responder: CommandResponder;
    private readonly feedbackRenderer: CommandFeedbackRenderer;

    public constructor(
        payload: CommandPayload,
        args: Arguments,
        options: CommandContextOptions = {},
    ) {
        const logger = options.logger ?? defaultCommandLogger;
        const source = createCommandSource(payload);

        this.args = args;
        this.invocation = new CommandInvocation(source);
        this.responder = createCommandResponder(source, logger);
        this.feedbackRenderer =
            options.feedbackRenderer ?? defaultCommandFeedbackRenderer;
    }

    public get raw(): CommandPayload {
        return this.invocation.raw;
    }

    public get isInteraction(): boolean {
        return this.invocation.isInteraction;
    }

    public get interaction(): ChatInputCommandInteraction | null {
        return this.invocation.interaction;
    }

    public get message(): Message | null {
        return this.invocation.message;
    }

    public get user(): User {
        return this.invocation.user;
    }

    public get guild(): Guild | null {
        return this.invocation.guild;
    }

    public get member(): GuildMember | null {
        return this.invocation.member;
    }

    public fetchMember(): Promise<GuildMember | null> {
        return this.invocation.fetchMember();
    }

    public deferReply(ephemeral = false): Promise<void> {
        return this.responder.deferReply(ephemeral);
    }

    public editReply(payload: CommandReplyPayload): Promise<Message> {
        return this.responder.editReply(payload);
    }

    public reply(payload: CommandReplyPayload): Promise<Message> {
        return this.responder.editReply(payload);
    }

    public followUp(payload: CommandReplyPayload): Promise<Message> {
        return this.responder.followUp(payload);
    }

    public replyError(message: string): Promise<Message> {
        return this.reply(this.feedbackRenderer.error(message));
    }

    public replySuccess(message: string): Promise<Message> {
        return this.reply(this.feedbackRenderer.success(message));
    }
}

```

### File: src/context/feedback.ts

```
import {
    ContainerBuilder,
    type RGBTuple,
    TextDisplayBuilder,
} from "discord.js";
import type { CommandReplyPayload } from "@/context";

export interface CommandFeedbackRenderer {
    error(message: string): CommandReplyPayload;
    success(message: string): CommandReplyPayload;
}

export interface ComponentFeedbackOptions {
    errorAccentColor?: number | RGBTuple;
    successAccentColor?: number | RGBTuple;
    errorPrefix?: string;
    successPrefix?: string;
}

export function createComponentFeedbackRenderer(
    options: ComponentFeedbackOptions = {},
): CommandFeedbackRenderer {
    const errorAccentColor = options.errorAccentColor ?? 0xed4245;
    const successAccentColor = options.successAccentColor ?? 0x57f287;
    const errorPrefix = options.errorPrefix ?? "❌";
    const successPrefix = options.successPrefix ?? "✅";

    function render(
        message: string,
        prefix: string,
        accentColor: number | RGBTuple,
    ): CommandReplyPayload {
        const container = new ContainerBuilder()
            .setAccentColor(accentColor)
            .addTextDisplayComponents(
                new TextDisplayBuilder({
                    content: `${prefix} ${message}`,
                }),
            );

        return {
            components: [container],
        };
    }

    return {
        error(message) {
            return render(message, errorPrefix, errorAccentColor);
        },

        success(message) {
            return render(message, successPrefix, successAccentColor);
        },
    };
}

export function createPlainTextFeedbackRenderer(
    options: Pick<
        ComponentFeedbackOptions,
        "errorPrefix" | "successPrefix"
    > = {},
): CommandFeedbackRenderer {
    const errorPrefix = options.errorPrefix ?? "❌";
    const successPrefix = options.successPrefix ?? "✅";

    return {
        error(message) {
            return `${errorPrefix} ${message}`;
        },

        success(message) {
            return `${successPrefix} ${message}`;
        },
    };
}

export const defaultCommandFeedbackRenderer = createComponentFeedbackRenderer();

```

### File: src/context/index.ts

```
export * from "./context";
export * from "./feedback";
export * from "./logger";
export * from "./reply";
export type { CommandPayload } from "./source";

```

### File: src/context/logger.ts

```
export interface CommandLogger {
    error(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    info?(message: string, ...args: unknown[]): void;
}

export const defaultCommandLogger: CommandLogger = {
    error(message, ...args) {
        console.error(message, ...args);
    },

    warn(message, ...args) {
        console.warn(message, ...args);
    },

    info(message, ...args) {
        console.info(message, ...args);
    },
};

```

### File: src/context/reply.ts

```
import type {
    APIContainerComponent,
    APIEmbed,
    APIFileComponent,
    APIMediaGalleryComponent,
    APISectionComponent,
    APISeparatorComponent,
    APITextDisplayComponent,
    ContainerComponentData,
    FileComponentData,
    InteractionEditReplyOptions,
    InteractionReplyOptions,
    JSONEncodable,
    MediaGalleryComponentData,
    MessageEditOptions,
    MessageMentionOptions,
    MessageReplyOptions,
    SectionComponentData,
    SeparatorComponentData,
    TextDisplayComponentData,
} from "discord.js";
import { MessageFlags } from "discord.js";

type ComponentV2 =
    | APIContainerComponent
    | APIFileComponent
    | APIMediaGalleryComponent
    | APISectionComponent
    | APISeparatorComponent
    | APITextDisplayComponent
    | ContainerComponentData
    | FileComponentData
    | MediaGalleryComponentData
    | SectionComponentData
    | SeparatorComponentData
    | TextDisplayComponentData
    | JSONEncodable<
          | APIContainerComponent
          | APIFileComponent
          | APIMediaGalleryComponent
          | APISectionComponent
          | APISeparatorComponent
          | APITextDisplayComponent
      >;

interface BaseReplyOptions {
    /**
     * Applies MessageFlags.Ephemeral to interaction replies.
     *
     * This option has no effect on message commands or interaction edits.
     */
    ephemeral?: boolean;

    /** Controls which mentions are permitted to ping users or roles. */
    mentions?: MessageMentionOptions;
}

/**
 * A traditional Discord message using content or embeds.
 *
 * Components V2 cannot be combined with these fields.
 */
export interface TraditionalReplyOptions extends BaseReplyOptions {
    content?: string;
    embeds?: readonly (APIEmbed | JSONEncodable<APIEmbed>)[];
    components?: never;
}

/**
 * A Discord Components V2 message.
 *
 * Traditional content and embeds cannot be combined with Components V2.
 */
export interface ComponentV2ReplyOptions extends BaseReplyOptions {
    content?: never;
    embeds?: never;
    components: readonly ComponentV2[];
}

export type CommandReplyOptions =
    TraditionalReplyOptions | ComponentV2ReplyOptions;

export type CommandReplyPayload = string | CommandReplyOptions;

function getReplyOptions(payload: CommandReplyPayload): CommandReplyOptions {
    return typeof payload === "string" ? { content: payload } : payload;
}

function getComponentFlags(
    payload: CommandReplyOptions,
): MessageFlags.IsComponentsV2 | undefined {
    return payload.components === undefined
        ? undefined
        : MessageFlags.IsComponentsV2;
}

/**
 * Centralized helper to map CommandReplyPayload to Discord.js message options.
 */
function buildMessageOptions(
    payload: CommandReplyPayload,
    isInitialInteraction = false,
) {
    const options = getReplyOptions(payload);
    let flags = getComponentFlags(options) ?? 0;

    if (isInitialInteraction && options.ephemeral) {
        flags |= MessageFlags.Ephemeral;
    }

    const base = {
        allowedMentions: options.mentions,
        flags: flags || undefined,
    };

    if (options.components !== undefined) {
        return {
            ...base,
            components: options.components,
        };
    }

    return {
        ...base,
        content: options.content,
        embeds: options.embeds,
    };
}

export function toInteractionReplyOptions(
    payload: CommandReplyPayload,
): InteractionReplyOptions {
    return buildMessageOptions(payload, true);
}

export function toInteractionEditReplyOptions(
    payload: CommandReplyPayload,
): InteractionEditReplyOptions {
    return buildMessageOptions(payload, false);
}

export function toMessageReplyOptions(
    payload: CommandReplyPayload,
): MessageReplyOptions {
    return buildMessageOptions(payload, false);
}

export function toMessageEditOptions(
    payload: CommandReplyPayload,
): MessageEditOptions {
    return buildMessageOptions(payload, false);
}

```

### File: src/context/responder.ts

```
import {
    type ChatInputCommandInteraction,
    type Message,
    MessageFlags,
} from "discord.js";
import type { CommandLogger } from "./logger";
import {
    type CommandReplyPayload,
    toInteractionEditReplyOptions,
    toInteractionReplyOptions,
    toMessageEditOptions,
    toMessageReplyOptions,
} from "./reply";
import type { CommandSource } from "./source";

export interface CommandResponder {
    deferReply(ephemeral?: boolean): Promise<void>;
    editReply(payload: CommandReplyPayload): Promise<Message>;
    followUp(payload: CommandReplyPayload): Promise<Message>;
}

class InteractionCommandResponder implements CommandResponder {
    public constructor(
        private readonly interaction: ChatInputCommandInteraction,
    ) {}

    public async deferReply(ephemeral = false): Promise<void> {
        if (this.interaction.deferred || this.interaction.replied) {
            return;
        }

        await this.interaction.deferReply({
            flags: ephemeral ? MessageFlags.Ephemeral : undefined,
        });
    }

    public async editReply(payload: CommandReplyPayload): Promise<Message> {
        if (this.interaction.deferred || this.interaction.replied) {
            return this.interaction.editReply(
                toInteractionEditReplyOptions(payload),
            );
        }

        await this.interaction.reply(toInteractionReplyOptions(payload));

        return this.interaction.fetchReply();
    }

    public async followUp(payload: CommandReplyPayload): Promise<Message> {
        if (!this.interaction.deferred && !this.interaction.replied) {
            await this.interaction.reply(toInteractionReplyOptions(payload));

            return this.interaction.fetchReply();
        }

        return this.interaction.followUp(toInteractionReplyOptions(payload));
    }
}

class MessageCommandResponder implements CommandResponder {
    private replyMessage: Message | null = null;

    public constructor(
        private readonly message: Message,
        private readonly logger: CommandLogger,
    ) {}

    public async deferReply(): Promise<void> {
        const channel = this.message.channel;

        if (!("sendTyping" in channel)) {
            return;
        }

        await channel.sendTyping().catch((error: unknown) => {
            const errorMessage =
                error instanceof Error ? error.message : String(error);

            this.logger.warn(
                `Failed to send a typing indicator in channel ${channel.id}: ${errorMessage}`,
            );
        });
    }

    public async editReply(payload: CommandReplyPayload): Promise<Message> {
        if (this.replyMessage) {
            return this.replyMessage.edit(toMessageEditOptions(payload));
        }

        this.replyMessage = await this.message.reply(
            toMessageReplyOptions(payload),
        );

        return this.replyMessage;
    }

    public followUp(payload: CommandReplyPayload): Promise<Message> {
        return this.message.reply(toMessageReplyOptions(payload));
    }
}

export function createCommandResponder(
    source: CommandSource,
    logger: CommandLogger,
): CommandResponder {
    return source.kind === "interaction"
        ? new InteractionCommandResponder(source.raw)
        : new MessageCommandResponder(source.raw, logger);
}

```

### File: src/context/source.ts

```
import {
    type ChatInputCommandInteraction,
    type Guild,
    GuildMember,
    type Message,
    type User,
} from "discord.js";

export type CommandPayload = ChatInputCommandInteraction | Message;

export type CommandSource =
    | {
          kind: "interaction";
          raw: ChatInputCommandInteraction;
      }
    | {
          kind: "message";
          raw: Message;
      };

export function createCommandSource(payload: CommandPayload): CommandSource {
    return "author" in payload
        ? {
              kind: "message",
              raw: payload,
          }
        : {
              kind: "interaction",
              raw: payload,
          };
}

export class CommandInvocation {
    public readonly raw: CommandPayload;
    public readonly isInteraction: boolean;
    public readonly user: User;
    public readonly guild: Guild | null;

    private resolvedMember: GuildMember | null;

    public constructor(public readonly source: CommandSource) {
        this.raw = source.raw;
        this.isInteraction = source.kind === "interaction";
        this.guild = source.raw.guild;

        if (source.kind === "interaction") {
            this.user = source.raw.user;

            this.resolvedMember =
                source.raw.member instanceof GuildMember
                    ? source.raw.member
                    : (source.raw.guild?.members.resolve(source.raw.user.id) ??
                      null);
        } else {
            this.user = source.raw.author;
            this.resolvedMember = source.raw.member;
        }
    }

    public get interaction(): ChatInputCommandInteraction | null {
        return this.source.kind === "interaction" ? this.source.raw : null;
    }

    public get message(): Message | null {
        return this.source.kind === "message" ? this.source.raw : null;
    }

    public get member(): GuildMember | null {
        return this.resolvedMember;
    }

    public async fetchMember(): Promise<GuildMember | null> {
        if (this.resolvedMember) {
            return this.resolvedMember;
        }

        if (!this.guild) {
            return null;
        }

        this.resolvedMember = await this.guild.members
            .fetch(this.user.id)
            .catch(() => null);

        return this.resolvedMember;
    }
}

```

### File: src/index.ts

```
export * from "./arguments";
export * from "./context";
export * from "./loader";
export * from "./manager";
export * from "./resolvers";

```

### File: src/loader/index.ts

```
import type { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";
import { loadModules } from "@/loader/moduleLoader";
import {
    type AnyCommand,
    type CommandHandlerConfig,
    CommandManager,
    createSlashCommandBuilder,
} from "@/manager";

export interface CommandLoaderConfig extends CommandHandlerConfig {
    directory: string;
    recursive?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCommand(value: unknown): value is AnyCommand {
    if (!isRecord(value)) {
        return false;
    }

    return (
        typeof value.name === "string" &&
        typeof value.description === "string" &&
        typeof value.execute === "function"
    );
}

function getCommandFromModule(
    moduleExports: Record<string, unknown>,
): AnyCommand | null {
    const candidate = moduleExports.default ?? moduleExports.command;
    return isCommand(candidate) ? candidate : null;
}

export async function loadCommands(config: CommandLoaderConfig) {
    const logger = config.logger ?? console;
    const manager = new CommandManager(config);

    const restPayloads: RESTPostAPIApplicationCommandsJSONBody[] = [];

    const { successful, failed } = await loadModules({
        directory: config.directory,
        recursive: config.recursive,
        logger,
    });

    for (const { fileName, moduleExports } of successful) {
        const command = getCommandFromModule(moduleExports);

        if (!command) {
            logger.warn(
                `Skipped: Module at ${fileName} does not export a valid command as default or as "command".`,
            );
            continue;
        }

        manager.registerCommands([command]);

        if (command.slash !== false) {
            restPayloads.push(createSlashCommandBuilder(command).toJSON());
        }
    }

    return {
        manager,
        restPayloads,
        diagnostics: {
            loadedCount: successful.length,
            failedCount: failed.length,
            failed,
        },
    };
}

```

### File: src/loader/moduleLoader.ts

```
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export interface ModuleLoaderConfig {
    directory: string;
    recursive?: boolean;
    logger?: {
        error: (message: string, ...args: unknown[]) => void;
        warn: (message: string, ...args: unknown[]) => void;
    };
}

export interface LoadResult {
    filePath: string;
    fileName: string;
    moduleExports: Record<string, unknown>;
}

export interface ModuleLoaderResponse {
    successful: LoadResult[];
    failed: { file: string; error: string }[];
}

/**
 * Scans a directory for valid source files and imports them safely.
 */
export async function loadModules(
    config: ModuleLoaderConfig,
): Promise<ModuleLoaderResponse> {
    const logger = config.logger ?? console;
    const response: ModuleLoaderResponse = { successful: [], failed: [] };

    try {
        const files = await fs.readdir(config.directory, {
            recursive: config.recursive,
        });

        const moduleFiles = files.filter((file) => {
            const baseName = path.basename(file);
            return (
                (baseName.endsWith(".ts") || baseName.endsWith(".js")) &&
                !baseName.endsWith(".d.ts") &&
                !baseName.startsWith("_") &&
                !baseName.startsWith(".")
            );
        });

        for (const file of moduleFiles) {
            const filePath = path.join(config.directory, file);

            try {
                const fileUrl = pathToFileURL(filePath).href;

                const moduleExports: Record<string, unknown> = await import(
                    fileUrl
                );

                response.successful.push({
                    filePath,
                    fileName: file,
                    moduleExports,
                });
            } catch (importError) {
                const errorMessage =
                    importError instanceof Error
                        ? importError.message
                        : String(importError);

                logger.error(
                    `Failed to load module file at ${file}`,
                    errorMessage,
                );
                response.failed.push({ file, error: errorMessage });
            }
        }
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        logger.error(
            `Failed to read directory: ${config.directory}`,
            errorMessage,
        );

        throw new Error(`Directory read failure: ${errorMessage}`);
    }

    return response;
}

```

### File: src/manager.ts

```
import { EventEmitter } from "node:events";
import {
    type ChatInputCommandInteraction,
    Collection,
    InteractionContextType,
    type Message,
    type PermissionResolvable,
    PermissionsBitField,
    SlashCommandBuilder,
} from "discord.js";
import {
    CommandContext,
    type CommandFeedbackRenderer,
    type CommandLogger,
    defaultCommandFeedbackRenderer,
    defaultCommandLogger,
} from "@/context";
import {
    type ArgumentSchema,
    addArgumentsToSlashCommand,
    formatArgumentUsage,
    type ParsedArguments,
    parseInteractionArguments,
    parseMessageArguments,
    tokenizeArguments,
    validateArgumentSchema,
} from "./arguments";

const EMPTY_ARGUMENTS = {} as const satisfies ArgumentSchema;

export interface Command<
    Schema extends ArgumentSchema = typeof EMPTY_ARGUMENTS,
> {
    name: string;
    description: string;

    aliases?: readonly string[];
    arguments?: Schema;

    slash?: boolean;
    guildOnly?: boolean;

    userPermissions?: readonly PermissionResolvable[];
    botPermissions?: readonly PermissionResolvable[];

    execute(ctx: CommandContext<ParsedArguments<Schema>>): Promise<void> | void;
}

export type AnyCommand = Command<ArgumentSchema>;

export function defineCommand<
    const Schema extends ArgumentSchema = typeof EMPTY_ARGUMENTS,
>(command: Command<Schema>): Command<Schema> {
    return command;
}

export interface CommandHandlerConfig {
    prefix: string | ((message: Message) => string | Promise<string>);

    allowOnlyDevs?: boolean;
    devIds?: readonly string[];

    logger?: CommandLogger;

    feedbackRenderer?: CommandFeedbackRenderer;

    isIgnored?: (userId: string) => boolean;
    allowBots?: boolean;
}

interface ResolvedCommandHandlerConfig {
    prefix: string | ((message: Message) => string | Promise<string>);

    allowOnlyDevs: boolean;
    devIds: readonly string[];

    logger: CommandLogger;

    feedbackRenderer: CommandFeedbackRenderer;

    isIgnored: ((userId: string) => boolean) | undefined;

    allowBots: boolean;
}

export function createSlashCommandBuilder(
    command: AnyCommand,
): SlashCommandBuilder {
    const builder = new SlashCommandBuilder()
        .setName(command.name)
        .setDescription(command.description);

    if (command.guildOnly) {
        builder.setContexts(InteractionContextType.Guild);
    }

    if (command.userPermissions?.length) {
        builder.setDefaultMemberPermissions(
            new PermissionsBitField(command.userPermissions).bitfield,
        );
    }

    addArgumentsToSlashCommand(builder, command.arguments ?? EMPTY_ARGUMENTS);

    return builder;
}

function validateCommand(command: AnyCommand): void {
    if (!/^[a-z0-9_-]{1,32}$/u.test(command.name)) {
        throw new Error(
            `Command name "${command.name}" must ` +
                "contain only lowercase letters, " +
                "numbers, hyphens, or underscores " +
                "and must be 1 to 32 characters long.",
        );
    }

    if (command.description.length < 1 || command.description.length > 100) {
        throw new Error(
            `Command "${command.name}" must have ` +
                "a description between 1 and 100 " +
                "characters.",
        );
    }

    for (const alias of command.aliases ?? []) {
        if (!/^[a-z0-9_-]+$/u.test(alias)) {
            throw new Error(
                `Command "${command.name}" has an ` +
                    `invalid alias: "${alias}".`,
            );
        }
    }

    validateArgumentSchema(command.name, command.arguments ?? EMPTY_ARGUMENTS);
}

export class CommandManager extends EventEmitter {
    public readonly commands = new Collection<string, AnyCommand>();

    private readonly config: ResolvedCommandHandlerConfig;

    private static _instance: CommandManager;

    constructor(config: CommandHandlerConfig) {
        super();

        this.config = {
            prefix: config.prefix,

            allowOnlyDevs: config.allowOnlyDevs ?? false,

            devIds: config.devIds ?? [],

            logger: config.logger ?? defaultCommandLogger,

            feedbackRenderer:
                config.feedbackRenderer ?? defaultCommandFeedbackRenderer,

            isIgnored: config.isIgnored,

            allowBots: config.allowBots ?? false,
        };

        CommandManager._instance = this;
    }

    public static get instance(): CommandManager {
        if (!CommandManager._instance) {
            throw new Error(
                "CommandManager has not been " + "initialized yet.",
            );
        }

        return CommandManager._instance;
    }

    public registerCommands(commands: readonly AnyCommand[]): void {
        for (const command of commands) {
            validateCommand(command);

            this.registerName(command.name, command);

            for (const alias of command.aliases ?? []) {
                this.registerName(alias, command);
            }
        }
    }

    private registerName(name: string, command: AnyCommand): void {
        const normalizedName = name.toLowerCase();

        const existing = this.commands.get(normalizedName);

        if (existing && existing !== command) {
            throw new Error(
                `Command name or alias ` +
                    `"${normalizedName}" is already ` +
                    `registered by "${existing.name}".`,
            );
        }

        this.commands.set(normalizedName, command);
    }

    private createContext<Arguments extends object>(
        payload: ChatInputCommandInteraction | Message,
        args: Arguments,
    ): CommandContext<Arguments> {
        return new CommandContext(payload, args, {
            logger: this.config.logger,

            feedbackRenderer: this.config.feedbackRenderer,
        });
    }

    public async handleMessage(message: Message): Promise<boolean> {
        const prefix =
            typeof this.config.prefix === "function"
                ? await this.config.prefix(message)
                : this.config.prefix;

        const normalizedContent = message.content
            .replace(/[\u200B-\u200D\uFEFF]/gu, "")
            .trimStart();

        if (!normalizedContent.startsWith(prefix)) {
            return false;
        }

        if (!this.canProcessUser(message.author.id, message.author.bot)) {
            return false;
        }

        const commandInput = normalizedContent.slice(prefix.length).trim();

        const tokenized = tokenizeArguments(commandInput);

        if (!tokenized.success) {
            const context = this.createContext(message, {});

            await context.replyError(tokenized.error.message);

            return false;
        }

        const tokens = tokenized.tokens;

        const commandName = tokens.shift()?.toLowerCase();

        if (!commandName) {
            return false;
        }

        const command = this.commands.get(commandName);

        if (!command) {
            return false;
        }

        const baseContext = this.createContext(message, {});

        if (!(await this.checkAccess(command, baseContext))) {
            return false;
        }

        const parsed = await parseMessageArguments(
            command.arguments ?? EMPTY_ARGUMENTS,
            message,
            tokens,
        );

        if (!parsed.success) {
            const usage = formatArgumentUsage(
                command.arguments ?? EMPTY_ARGUMENTS,
            );

            const usageText = usage
                ? `\nUsage: \`${prefix}` + `${command.name} ${usage}\``
                : "";

            await baseContext.replyError(parsed.error.message + usageText);

            return false;
        }

        return this.executeCommand(
            command,
            this.createContext(message, parsed.value),
        );
    }

    public async handleInteraction(
        interaction: ChatInputCommandInteraction,
    ): Promise<boolean> {
        if (!interaction.isChatInputCommand()) {
            return false;
        }

        if (!this.canProcessUser(interaction.user.id, interaction.user.bot)) {
            return false;
        }

        const command = this.commands.get(
            interaction.commandName.toLowerCase(),
        );

        if (!command || command.slash === false) {
            return false;
        }

        const baseContext = this.createContext(interaction, {});

        if (!(await this.checkAccess(command, baseContext))) {
            return false;
        }

        const parsed = await parseInteractionArguments(
            command.arguments ?? EMPTY_ARGUMENTS,
            interaction,
        );

        if (!parsed.success) {
            await baseContext.replyError(parsed.error.message);

            return false;
        }

        return this.executeCommand(
            command,
            this.createContext(interaction, parsed.value),
        );
    }

    private canProcessUser(userId: string, isBot: boolean): boolean {
        if (isBot && !this.config.allowBots) {
            return false;
        }

        if (this.config.isIgnored?.(userId)) {
            return false;
        }

        if (this.config.allowOnlyDevs && !this.config.devIds.includes(userId)) {
            return false;
        }

        return true;
    }

    private async checkAccess(
        command: AnyCommand,
        context: CommandContext<Record<string, never>>,
    ): Promise<boolean> {
        if (command.guildOnly && !context.guild) {
            await context.replyError(
                "This command can only be used " + "in a server.",
            );

            return false;
        }

        if (!context.guild) {
            return true;
        }

        const channel = context.raw.channel;

        if (!channel?.isTextBased() || channel.isDMBased()) {
            return true;
        }

        const member = context.member ?? (await context.fetchMember());

        if (!member) {
            await context.replyError(
                "Could not resolve your server " + "member data.",
            );

            return false;
        }

        if (command.userPermissions?.length) {
            const missingPermissions = member
                .permissionsIn(channel)
                .missing(command.userPermissions);

            if (missingPermissions.length > 0) {
                await context.replyError(
                    "You lack the required " +
                        "permissions to use this: " +
                        `\`${missingPermissions.join(", ")}\``,
                );

                return false;
            }
        }

        if (command.botPermissions?.length) {
            const botMember =
                context.guild.members.me ??
                (await context.guild.members.fetchMe().catch(() => null));

            if (!botMember) {
                await context.replyError(
                    "Could not resolve my server " + "member data.",
                );

                return false;
            }

            const missingPermissions = botMember
                .permissionsIn(channel)
                .missing(command.botPermissions);

            if (missingPermissions.length > 0) {
                await context.replyError(
                    "I am missing permissions " +
                        "to execute this: " +
                        `\`${missingPermissions.join(", ")}\``,
                );

                return false;
            }
        }

        return true;
    }

    private async executeCommand(
        command: AnyCommand,
        context: CommandContext<ParsedArguments<ArgumentSchema>>,
    ): Promise<boolean> {
        try {
            this.emit("commandStart", command, context);

            await command.execute(context);

            this.emit("commandSuccess", command, context);

            return true;
        } catch (error) {
            this.config.logger.error(`Error executing ${command.name}:`, error);

            await context
                .replyError(
                    "An unexpected error occurred " +
                        "while executing this command.",
                )
                .catch(() => {});

            this.emit("commandError", command, error, context);

            return false;
        }
    }
}

```

### File: src/resolvers.ts

```
import type { Guild, GuildMember, Message, Role, User } from "discord.js";
import { distance } from "fastest-levenshtein";

function cleanDiscordId(input: string): string {
    return input.replace(/[^0-9]/gu, "");
}

function findUserInGuildCache(input: string, guild: Guild): User | undefined {
    const cleanInput = cleanDiscordId(input);

    if (/^\d{17,20}$/u.test(cleanInput)) {
        const exactMember = guild.members.cache.get(cleanInput);

        if (exactMember) {
            return exactMember.user;
        }
    }

    const lowerInput = input.trim().toLowerCase();
    const inputLength = lowerInput.length;

    if (!lowerInput) {
        return undefined;
    }

    const allowFuzzy = inputLength >= 4;
    const typoThreshold = Math.min(Math.floor(inputLength / 4), 3);
    const boundaryInput = ` ${lowerInput}`;

    let bestPrefixMatch: GuildMember | undefined;
    let bestFuzzyMatch: GuildMember | undefined;
    let lowestDistance = Number.POSITIVE_INFINITY;

    for (const member of guild.members.cache.values()) {
        const username = member.user.username.toLowerCase();
        const displayName = member.displayName.toLowerCase();
        const globalName = member.user.globalName?.toLowerCase() ?? "";

        if (
            username === lowerInput ||
            displayName === lowerInput ||
            globalName === lowerInput
        ) {
            return member.user;
        }

        if (
            !bestPrefixMatch &&
            (username.startsWith(lowerInput) ||
                username.includes(boundaryInput) ||
                displayName.startsWith(lowerInput) ||
                displayName.includes(boundaryInput) ||
                (globalName &&
                    (globalName.startsWith(lowerInput) ||
                        globalName.includes(boundaryInput))))
        ) {
            bestPrefixMatch = member;
            continue;
        }

        if (allowFuzzy && !bestPrefixMatch) {
            const namesToCheck = [username, displayName];

            if (globalName) {
                namesToCheck.push(globalName);
            }

            for (const name of namesToCheck) {
                const currentDistance = distance(lowerInput, name);

                if (
                    currentDistance < lowestDistance &&
                    currentDistance <= typoThreshold
                ) {
                    lowestDistance = currentDistance;
                    bestFuzzyMatch = member;
                }
            }
        }
    }

    return bestPrefixMatch?.user ?? bestFuzzyMatch?.user;
}

export async function getUserFromInput(
    input: string,
    message: Message,
): Promise<User | undefined> {
    const trimmed = input.trim();

    if (!trimmed) {
        return undefined;
    }

    const cleanInput = cleanDiscordId(trimmed);

    if (/^\d{17,20}$/u.test(cleanInput)) {
        const mentionedUser = message.mentions.users.get(cleanInput);

        if (mentionedUser) {
            return mentionedUser;
        }

        const fetchedUser = await message.client.users
            .fetch(cleanInput)
            .catch(() => null);

        if (fetchedUser) {
            return fetchedUser;
        }
    }

    if (message.guild) {
        return findUserInGuildCache(trimmed, message.guild);
    }

    return undefined;
}

export function getRoleFromInput(
    input: string,
    guild: Guild,
    allowedRoleIds?: readonly string[],
): Role | undefined {
    const trimmed = input.trim();

    if (!trimmed) {
        return undefined;
    }

    const cleanInput = cleanDiscordId(trimmed);

    if (/^\d{17,20}$/u.test(cleanInput)) {
        const role = guild.roles.cache.get(cleanInput);

        if (role && (!allowedRoleIds || allowedRoleIds.includes(role.id))) {
            return role;
        }
    }

    const lowerInput = trimmed.toLowerCase();

    const candidates = guild.roles.cache.filter(
        (role) => !allowedRoleIds || allowedRoleIds.includes(role.id),
    );

    const exactMatch = candidates.find(
        (role) => role.name.toLowerCase() === lowerInput,
    );

    if (exactMatch) {
        return exactMatch;
    }

    const partialMatch = candidates.find((role) =>
        role.name.toLowerCase().includes(lowerInput),
    );

    if (partialMatch) {
        return partialMatch;
    }

    if (lowerInput.length < 4) {
        return undefined;
    }

    const maxDistance = Math.min(
        Math.max(Math.floor(lowerInput.length / 4), 1),
        3,
    );

    let closestRole: Role | undefined;
    let lowestDistance = Number.POSITIVE_INFINITY;

    for (const role of candidates.values()) {
        const currentDistance = distance(lowerInput, role.name.toLowerCase());

        if (
            currentDistance < lowestDistance &&
            currentDistance <= maxDistance
        ) {
            lowestDistance = currentDistance;
            closestRole = role;
        }
    }

    return closestRole;
}

```

### File: tests/arguments/builder.test.ts

```
import { describe, expect, test } from "bun:test";
import { argument } from "@/arguments/builder";

describe("Argument Builder", () => {
    describe("String Argument", () => {
        test("validates min and max lengths", async () => {
            const arg = argument.string({
                description: "test",
                minLength: 3,
                maxLength: 5,
            });

            expect((await arg._schema.safeParseAsync("hi")).success).toBe(
                false,
            );
            expect((await arg._schema.safeParseAsync("hello")).success).toBe(
                true,
            );
            expect((await arg._schema.safeParseAsync("too long")).success).toBe(
                false,
            );
        });
    });

    describe("Integer Argument", () => {
        test("coerces numeric strings to integers", async () => {
            const arg = argument.integer({ description: "test" });
            const result = await arg._schema.safeParseAsync("123");

            expect(result.success).toBe(true);
            if (result.success) expect(result.data).toBe(123);
        });

        test("fails on floating point strings", async () => {
            const arg = argument.integer({ description: "test" });
            const result = await arg._schema.safeParseAsync("123.45");
            expect(result.success).toBe(false);
        });
    });

    describe("Number Argument", () => {
        test("coerces valid floating point strings and validates bounds", async () => {
            const arg = argument.number({
                description: "test",
                min: 1.5,
                max: 5.5,
            });

            expect((await arg._schema.safeParseAsync("3.14")).success).toBe(
                true,
            ); // Coerced
            expect((await arg._schema.safeParseAsync(2.5)).success).toBe(true);
            expect((await arg._schema.safeParseAsync("1.0")).success).toBe(
                false,
            ); // Below min
            expect((await arg._schema.safeParseAsync("6.0")).success).toBe(
                false,
            ); // Above max
        });
    });

    describe("Boolean Argument", () => {
        test("coerces truthy and falsy string values", async () => {
            const arg = argument.boolean({ description: "test" });

            const trueCases = ["true", "yes", "y", "1", "on", "enable"];
            for (const val of trueCases) {
                const res = await arg._schema.safeParseAsync(val);
                expect(res.success && res.data === true).toBe(true);
            }

            const falseCases = ["false", "no", "n", "0", "off", "disable"];
            for (const val of falseCases) {
                const res = await arg._schema.safeParseAsync(val);
                expect(res.success && res.data === false).toBe(true);
            }
        });
    });

    describe("URL Argument", () => {
        test("validates properly formatted URLs", async () => {
            const arg = argument.url({ description: "test" });

            expect(
                (await arg._schema.safeParseAsync("https://example.com"))
                    .success,
            ).toBe(true);
            expect(
                (await arg._schema.safeParseAsync("not-a-url")).success,
            ).toBe(false);
        });
    });

    describe("Optional vs Required", () => {
        test("allows null when required is false", async () => {
            const arg = argument.string({
                description: "test",
                required: false,
            });
            const result = await arg._schema.safeParseAsync(null);
            expect(result.success).toBe(true);
        });

        test("rejects null when required is true", async () => {
            const arg = argument.string({
                description: "test",
                required: true,
            });
            const result = await arg._schema.safeParseAsync(null);
            expect(result.success).toBe(false);
        });
    });
});

```

### File: tests/arguments/interactionParser.test.ts

```
import { describe, expect, mock, test } from "bun:test";
import type { ChatInputCommandInteraction } from "discord.js";
import { argument } from "@/arguments/builder";
import { parseInteractionArguments } from "@/arguments/interactionParser";

describe("Interaction Parser", () => {
    const createMockInteraction = (options: Record<string, unknown>) => {
        return {
            options: {
                getString: (name: string) => options[name] ?? null,
                getInteger: (name: string) => options[name] ?? null,
                getNumber: (name: string) => options[name] ?? null,
                getBoolean: (name: string) => options[name] ?? null,
                getUser: (name: string) => options[name] ?? null,
                getRole: (name: string) => options[name] ?? null,
            },
            guild: {
                members: {
                    fetch: mock().mockResolvedValue({ user: { id: "1" } }),
                },
                roles: {
                    fetch: mock().mockResolvedValue({
                        name: "Admin",
                        id: "role-1",
                    }),
                },
            },
        } as unknown as ChatInputCommandInteraction;
    };

    test("successfully parses valid string and integer options", async () => {
        const schema = {
            query: argument.string({
                description: "Search query",
                required: true,
            }),
            limit: argument.integer({ description: "Result limit" }),
        };

        const interaction = createMockInteraction({ query: "hello", limit: 5 });
        const result = await parseInteractionArguments(schema, interaction);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.value.query).toBe("hello");
            expect(result.value.limit).toBe(5);
        }
    });

    test("returns MISSING_ARGUMENT if a required option is absent", async () => {
        const schema = {
            query: argument.string({
                description: "Search query",
                required: true,
            }),
        };

        const interaction = createMockInteraction({}); // Query is null[cite: 1]
        const result = await parseInteractionArguments(schema, interaction);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.code).toBe("MISSING_ARGUMENT");
            expect(result.error.argument).toBe("query");
        }
    });

    test("validates schema constraints during interaction parsing", async () => {
        const schema = {
            limit: argument.integer({ description: "Result limit", min: 10 }),
        };

        const interaction = createMockInteraction({ limit: 5 });
        const result = await parseInteractionArguments(schema, interaction);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.code).toBe("INVALID_ARGUMENT");
        }
    });
});

```

### File: tests/arguments/messageParser.test.ts

```
import { describe, expect, mock, test } from "bun:test";
import type { Message } from "discord.js";
import { argument } from "@/arguments/builder";
import { parseMessageArguments } from "@/arguments/messageParser";

// Mock the resolver functions since they rely heavily on Discord.js caches
mock.module("@/resolvers", () => ({
    getUserFromInput: mock((input: string) =>
        input === "123" ? { id: "123" } : undefined,
    ),
    getRoleFromInput: mock((input: string) =>
        input === "admin" ? { name: "admin" } : undefined,
    ),
}));

describe("Message Parser", () => {
    const createMockMessage = () =>
        ({
            guild: {
                members: {
                    fetch: mock().mockResolvedValue({ user: { id: "123" } }),
                },
            },
        }) as unknown as Message;

    test("parses sequential tokens into schema definitions", async () => {
        const schema = {
            count: argument.integer({ description: "Amount", required: true }),
            flag: argument.boolean({ description: "Enable feature" }),
        };

        const msg = createMockMessage();
        const tokens = ["42", "true"];

        const result = await parseMessageArguments(schema, msg, tokens);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.value.count).toBe(42);
            expect(result.value.flag).toBe(true);
        }
    });

    test("consumes remaining tokens into a rest argument", async () => {
        const schema = {
            mode: argument.string({ description: "Mode" }),
            reason: argument.string({ description: "Reason", rest: true }),
        };

        const msg = createMockMessage();
        const tokens = ["ban", "spam", "and", "abuse"];

        const result = await parseMessageArguments(schema, msg, tokens);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.value.mode).toBe("ban");
            expect(result.value.reason).toBe("spam and abuse"); // Rest argument joins array[cite: 1]
        }
    });

    test("returns TOO_MANY_ARGUMENTS if tokens exceed schema length without a rest arg", async () => {
        const schema = {
            id: argument.integer({ description: "ID" }),
        };

        const msg = createMockMessage();
        const tokens = ["1", "extra", "token"]; // More tokens than arguments

        const result = await parseMessageArguments(schema, msg, tokens);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.code).toBe("TOO_MANY_ARGUMENTS");
        }
    });
});

```

### File: tests/arguments/tokenizer.test.ts

```
import { describe, expect, test } from "bun:test";
import { tokenizeArguments } from "@/arguments/tokenizer";

describe("Tokenizer", () => {
    test("splits simple space-separated arguments", () => {
        const result = tokenizeArguments("hello world 123");
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.tokens).toEqual(["hello", "world", "123"]);
        }
    });

    test("preserves spaces inside double quotes", () => {
        const result = tokenizeArguments('hello "world space" 123');
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.tokens).toEqual(["hello", "world space", "123"]);
        }
    });

    test("preserves spaces inside single quotes", () => {
        const result = tokenizeArguments("hello 'world space' 123");
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.tokens).toEqual(["hello", "world space", "123"]);
        }
    });

    test("handles escaped quotes", () => {
        const result = tokenizeArguments('hello \\"world\\"');
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.tokens).toEqual(["hello", '"world"']);
        }
    });

    test("fails on unterminated double quotes", () => {
        const result = tokenizeArguments('hello "world');
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.code).toBe("INVALID_SYNTAX");
        }
    });

    test("fails on unterminated single quotes", () => {
        const result = tokenizeArguments("hello 'world");
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.code).toBe("INVALID_SYNTAX");
        }
    });
});

```

### File: tests/arguments/utils.test.ts

```
import { describe, expect, spyOn, test } from "bun:test";
import { SlashCommandBuilder } from "discord.js";
import { argument } from "@/arguments/builder";
import {
    addArgumentsToSlashCommand,
    formatArgumentUsage,
    validateArgumentSchema,
} from "@/arguments/utils";

describe("Argument Utils", () => {
    describe("formatArgumentUsage", () => {
        test("formats required and optional arguments correctly", () => {
            const schema = {
                user: argument.user({
                    description: "The user",
                    required: true,
                }),
                reason: argument.string({ description: "The reason" }), // default required: false
                flags: argument.string({
                    description: "Extra flags",
                    rest: true,
                }),
            };

            const usage = formatArgumentUsage(schema);
            expect(usage).toBe("<user> [reason] [flags...]");
        });
    });

    describe("validateArgumentSchema", () => {
        test("passes a valid schema", () => {
            const schema = {
                target: argument.user({
                    description: "Target",
                    required: true,
                }),
                reason: argument.string({
                    description: "Reason",
                    required: false,
                    rest: true,
                }),
            };
            expect(() => validateArgumentSchema("ban", schema)).not.toThrow();
        });

        test("throws if required argument comes after optional", () => {
            const schema = {
                reason: argument.string({
                    description: "Reason",
                    required: false,
                }),
                target: argument.user({
                    description: "Target",
                    required: true,
                }),
            };
            expect(() => validateArgumentSchema("test", schema)).toThrow(
                'Required argument "target" cannot appear after an optional argument in command "test".',
            );
        });

        test("throws if argument comes after a rest argument", () => {
            const schema = {
                message: argument.string({ description: "Msg", rest: true }),
                other: argument.string({ description: "Other" }),
            };
            expect(() => validateArgumentSchema("test", schema)).toThrow(
                'Argument "other" cannot appear after a rest argument in command "test".',
            );
        });

        test("throws on invalid names", () => {
            const schema = {
                "Invalid Name!": argument.string({ description: "test" }),
            };
            expect(() => validateArgumentSchema("test", schema)).toThrow(
                'Command "test" has an invalid argument name: "Invalid Name!".',
            );
        });
    });

    test("appends corresponding options to SlashCommandBuilder based on schema", () => {
        const builder = new SlashCommandBuilder()
            .setName("test")
            .setDescription("test cmd");

        // Spies to verify the correct discord.js builder methods are called
        const stringSpy = spyOn(builder, "addStringOption");
        const integerSpy = spyOn(builder, "addIntegerOption");
        const userSpy = spyOn(builder, "addUserOption");

        const schema = {
            title: argument.string({
                description: "The title",
                required: true,
                maxLength: 100,
            }),
            age: argument.integer({ description: "The age", min: 18 }),
            target: argument.user({ description: "The target" }),
        };

        addArgumentsToSlashCommand(builder, schema);

        expect(stringSpy).toHaveBeenCalled();
        expect(integerSpy).toHaveBeenCalled();
        expect(userSpy).toHaveBeenCalled();

        // The builder should now contain 3 configured options
        expect(builder.options.length).toBe(3);

        const json = builder.toJSON();

        // Assert string option properties
        const stringOpt = json.options?.find((o) => o.name === "title") as any;
        expect(stringOpt).toBeDefined();
        expect(stringOpt.description).toBe("The title");
        expect(stringOpt.required).toBe(true);
        expect(stringOpt.max_length).toBe(100);

        // Assert integer option properties
        const intOpt = json.options?.find((o) => o.name === "age") as any;
        expect(intOpt).toBeDefined();
        expect(intOpt.min_value).toBe(18);
    });
});

```

### File: tests/context.test.ts

```
import { describe, expect, mock, test } from "bun:test";
import {
    type ChatInputCommandInteraction,
    type Guild,
    type GuildMember,
    type InteractionDeferReplyOptions,
    type InteractionEditReplyOptions,
    type InteractionReplyOptions,
    type Message,
    type MessageEditOptions,
    MessageFlags,
    type MessageReplyOptions,
    TextDisplayBuilder,
} from "discord.js";
import {
    CommandContext,
    type CommandFeedbackRenderer,
    type CommandLogger,
    createComponentFeedbackRenderer,
    createPlainTextFeedbackRenderer,
    toInteractionEditReplyOptions,
    toInteractionReplyOptions,
    toMessageEditOptions,
    toMessageReplyOptions,
} from "@/context";

function createReplyMessage(id = "reply-1") {
    let message: Message;

    const edit = mock(async (_payload: MessageEditOptions) => message);

    message = {
        id,
        edit,
    } as unknown as Message;

    return { message, edit };
}

interface MockInteractionOptions {
    deferred?: boolean;
    replied?: boolean;
    guild?: Guild | null;
    member?: GuildMember | null;
    userId?: string;
}

function createInteraction(options: MockInteractionOptions = {}) {
    const initialReply = createReplyMessage("initial-reply");
    const editedReply = createReplyMessage("edited-reply");
    const followUpReply = createReplyMessage("follow-up-reply");

    const deferReply = mock(
        async (_payload?: InteractionDeferReplyOptions) => undefined,
    );

    const reply = mock(async (_payload: InteractionReplyOptions) => undefined);

    const fetchReply = mock(async () => initialReply.message);

    const editReply = mock(
        async (_payload: InteractionEditReplyOptions) => editedReply.message,
    );

    const followUp = mock(
        async (_payload: InteractionReplyOptions) => followUpReply.message,
    );

    const interaction = {
        user: {
            id: options.userId ?? "user-1",
            bot: false,
        },
        guild: options.guild ?? null,
        member: options.member ?? null,
        channel: null,
        deferred: options.deferred ?? false,
        replied: options.replied ?? false,
        deferReply,
        reply,
        fetchReply,
        editReply,
        followUp,
    } as unknown as ChatInputCommandInteraction;

    return {
        interaction,
        deferReply,
        reply,
        fetchReply,
        editReply,
        followUp,
        initialReply: initialReply.message,
        editedReply: editedReply.message,
        followUpReply: followUpReply.message,
    };
}

interface MockMessageOptions {
    guild?: Guild | null;
    member?: GuildMember | null;
    userId?: string;
    sendTyping?: () => Promise<unknown>;
}

function createMessage(options: MockMessageOptions = {}) {
    const firstReply = createReplyMessage("message-reply");

    const sendTyping = options.sendTyping ?? mock(async () => undefined);

    const reply = mock(
        async (_payload: MessageReplyOptions) => firstReply.message,
    );

    const message = {
        author: {
            id: options.userId ?? "user-1",
            bot: false,
        },
        guild: options.guild ?? null,
        member: options.member ?? null,
        channel: {
            id: "channel-1",
            sendTyping,
        },
        reply,
    } as unknown as Message;

    return {
        message,
        reply,
        sendTyping,
        replyMessage: firstReply.message,
        editReplyMessage: firstReply.edit,
    };
}

function createLogger(): CommandLogger & {
    error: ReturnType<typeof mock>;
    warn: ReturnType<typeof mock>;
} {
    return {
        error: mock(() => undefined),
        warn: mock(() => undefined),
    };
}

describe("reply payload normalization", () => {
    test("normalizes string payloads for interaction replies", () => {
        const result = toInteractionReplyOptions("hello");

        expect(result).toEqual({
            allowedMentions: undefined,
            content: "hello",
            embeds: undefined,
            flags: undefined,
        });
    });

    test("maps mentions to allowedMentions", () => {
        const mentions = { parse: [] } as const;

        const result = toInteractionReplyOptions({
            content: "hello",
            mentions,
        });

        expect(result.allowedMentions).toEqual(mentions);
    });

    test("adds ephemeral and Components V2 flags to interaction replies", () => {
        const component = new TextDisplayBuilder({
            content: "hello",
        });

        const result = toInteractionReplyOptions({
            components: [component],
            ephemeral: true,
        });

        expect(result.flags).toBe(
            MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        );

        expect(result.components).toEqual([component]);
    });

    test("does not apply ephemeral to interaction edits", () => {
        const component = new TextDisplayBuilder({
            content: "hello",
        });

        const result = toInteractionEditReplyOptions({
            components: [component],
            ephemeral: true,
        });

        expect(result.flags).toBe(MessageFlags.IsComponentsV2);
    });

    test("does not apply ephemeral to message replies", () => {
        const result = toMessageReplyOptions({
            content: "hello",
            ephemeral: true,
        });

        expect(result.flags).toBeUndefined();
        expect(result.content).toBe("hello");
    });

    test("applies Components V2 flags to message replies and edits", () => {
        const component = new TextDisplayBuilder({
            content: "hello",
        });

        const payload = {
            components: [component],
        } as const;

        expect(toMessageReplyOptions(payload).flags).toBe(
            MessageFlags.IsComponentsV2,
        );

        expect(toMessageEditOptions(payload).flags).toBe(
            MessageFlags.IsComponentsV2,
        );
    });
});

describe("feedback renderers", () => {
    test("plain text renderer uses custom prefixes", () => {
        const renderer = createPlainTextFeedbackRenderer({
            errorPrefix: "ERR:",
            successPrefix: "OK:",
        });

        expect(renderer.error("failed")).toBe("ERR: failed");

        expect(renderer.success("worked")).toBe("OK: worked");
    });

    test("component renderer creates one Components V2 container", () => {
        const renderer = createComponentFeedbackRenderer({
            errorPrefix: "ERROR",
            errorAccentColor: 0x123456,
        });

        const payload = renderer.error("failed");

        expect(typeof payload).not.toBe("string");

        if (typeof payload !== "string") {
            expect(payload.components).toHaveLength(1);
            expect(payload.content).toBeUndefined();
            expect(payload.embeds).toBeUndefined();
        }
    });
});

describe("CommandContext invocation data", () => {
    test("exposes interaction properties without instanceof mocking", () => {
        const { interaction } = createInteraction({
            userId: "interaction-user",
        });

        const ctx = new CommandContext(interaction, {
            query: "hello",
        });

        expect(ctx.raw).toBe(interaction);
        expect(ctx.isInteraction).toBe(true);
        expect(ctx.interaction).toBe(interaction);
        expect(ctx.message).toBeNull();
        expect(ctx.user.id).toBe("interaction-user");
        expect(ctx.guild).toBeNull();
        expect(ctx.member).toBeNull();
        expect(ctx.args).toEqual({ query: "hello" });
    });

    test("exposes message properties", () => {
        const { message } = createMessage({
            userId: "message-user",
        });

        const ctx = new CommandContext(message, {
            count: 2,
        });

        expect(ctx.raw).toBe(message);
        expect(ctx.isInteraction).toBe(false);
        expect(ctx.interaction).toBeNull();
        expect(ctx.message).toBe(message);
        expect(ctx.user.id).toBe("message-user");
        expect(ctx.args).toEqual({ count: 2 });
    });

    test("resolves an interaction member from the guild cache", () => {
        const member = {
            id: "member-1",
        } as unknown as GuildMember;

        const resolve = mock(() => member);

        const guild = {
            members: { resolve },
        } as unknown as Guild;

        const { interaction } = createInteraction({ guild });

        const ctx = new CommandContext(interaction, {});

        expect(resolve).toHaveBeenCalledWith("user-1");
        expect(ctx.member).toBe(member);
    });

    test("returns an already resolved member without fetching", async () => {
        const member = {
            id: "member-1",
        } as unknown as GuildMember;

        const fetch = mock(async () => member);

        const guild = {
            members: { fetch },
        } as unknown as Guild;

        const { message } = createMessage({
            guild,
            member,
        });

        const ctx = new CommandContext(message, {});

        expect(await ctx.fetchMember()).toBe(member);
        expect(fetch).not.toHaveBeenCalled();
    });

    test("fetches and caches an unresolved member", async () => {
        const member = {
            id: "member-1",
        } as unknown as GuildMember;

        const fetch = mock(async () => member);

        const guild = {
            members: { fetch },
        } as unknown as Guild;

        const { message } = createMessage({
            guild,
            member: null,
        });

        const ctx = new CommandContext(message, {});

        expect(await ctx.fetchMember()).toBe(member);
        expect(await ctx.fetchMember()).toBe(member);

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith("user-1");
    });

    test("returns null when member fetching fails", async () => {
        const fetch = mock(async () => {
            throw new Error("not found");
        });

        const guild = {
            members: { fetch },
        } as unknown as Guild;

        const { message } = createMessage({
            guild,
            member: null,
        });

        const ctx = new CommandContext(message, {});

        expect(await ctx.fetchMember()).toBeNull();
    });

    test("returns null when fetching a member outside a guild", async () => {
        const { message } = createMessage({
            guild: null,
            member: null,
        });

        const ctx = new CommandContext(message, {});

        expect(await ctx.fetchMember()).toBeNull();
    });
});

describe("CommandContext interaction responses", () => {
    test("defers an ephemeral interaction reply", async () => {
        const { interaction, deferReply } = createInteraction();

        const ctx = new CommandContext(interaction, {});

        await ctx.deferReply(true);

        expect(deferReply).toHaveBeenCalledWith({
            flags: MessageFlags.Ephemeral,
        });
    });

    test("does not defer an already deferred interaction", async () => {
        const { interaction, deferReply } = createInteraction({
            deferred: true,
        });

        const ctx = new CommandContext(interaction, {});

        await ctx.deferReply();

        expect(deferReply).not.toHaveBeenCalled();
    });

    test("does not defer an already replied interaction", async () => {
        const { interaction, deferReply } = createInteraction({
            replied: true,
        });

        const ctx = new CommandContext(interaction, {});

        await ctx.deferReply();

        expect(deferReply).not.toHaveBeenCalled();
    });

    test("sends and fetches the initial interaction reply", async () => {
        const { interaction, reply, fetchReply, initialReply } =
            createInteraction();

        const ctx = new CommandContext(interaction, {});

        const result = await ctx.reply("hello");

        expect(reply).toHaveBeenCalledWith(
            expect.objectContaining({
                content: "hello",
            }),
        );

        expect(fetchReply).toHaveBeenCalledTimes(1);
        expect(result).toBe(initialReply);
    });

    test("edits a deferred interaction reply", async () => {
        const { interaction, reply, editReply, editedReply } =
            createInteraction({
                deferred: true,
            });

        const ctx = new CommandContext(interaction, {});

        const result = await ctx.editReply("updated");

        expect(reply).not.toHaveBeenCalled();

        expect(editReply).toHaveBeenCalledWith(
            expect.objectContaining({
                content: "updated",
            }),
        );

        expect(result).toBe(editedReply);
    });

    test("uses the initial reply path for a first follow-up", async () => {
        const { interaction, reply, followUp, initialReply } =
            createInteraction();

        const ctx = new CommandContext(interaction, {});

        const result = await ctx.followUp("hello");

        expect(reply).toHaveBeenCalledTimes(1);
        expect(followUp).not.toHaveBeenCalled();
        expect(result).toBe(initialReply);
    });

    test("uses interaction.followUp after an existing response", async () => {
        const { interaction, reply, followUp, followUpReply } =
            createInteraction({
                replied: true,
            });

        const ctx = new CommandContext(interaction, {});

        const result = await ctx.followUp("another");

        expect(reply).not.toHaveBeenCalled();

        expect(followUp).toHaveBeenCalledWith(
            expect.objectContaining({
                content: "another",
            }),
        );

        expect(result).toBe(followUpReply);
    });
});

describe("CommandContext message responses", () => {
    test("sends a typing indicator when deferring", async () => {
        const { message, sendTyping } = createMessage();

        const ctx = new CommandContext(message, {});

        await ctx.deferReply();

        expect(sendTyping).toHaveBeenCalledTimes(1);
    });

    test("logs typing indicator failures without throwing", async () => {
        const sendTyping = mock(async () => {
            throw new Error("typing failed");
        });

        const logger = createLogger();

        const { message } = createMessage({
            sendTyping,
        });

        const ctx = new CommandContext(message, {}, { logger });

        await expect(ctx.deferReply()).resolves.toBeUndefined();

        expect(logger.warn).toHaveBeenCalledWith(
            "Failed to send a typing indicator in channel channel-1: typing failed",
        );
    });

    test("creates the first message reply", async () => {
        const { message, reply, replyMessage } = createMessage();

        const ctx = new CommandContext(message, {});

        const result = await ctx.reply("hello");

        expect(reply).toHaveBeenCalledWith(
            expect.objectContaining({
                content: "hello",
            }),
        );

        expect(result).toBe(replyMessage);
    });

    test("edits the stored reply on subsequent reply calls", async () => {
        const { message, reply, editReplyMessage, replyMessage } =
            createMessage();

        const ctx = new CommandContext(message, {});

        await ctx.reply("first");

        const result = await ctx.reply("second");

        expect(reply).toHaveBeenCalledTimes(1);

        expect(editReplyMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                content: "second",
            }),
        );

        expect(result).toBe(replyMessage);
    });

    test("always creates a new message for follow-ups", async () => {
        const { message, reply, editReplyMessage } = createMessage();

        const ctx = new CommandContext(message, {});

        await ctx.reply("first");
        await ctx.followUp("second");

        expect(reply).toHaveBeenCalledTimes(2);
        expect(editReplyMessage).not.toHaveBeenCalled();
    });

    test("uses the configured feedback renderer", async () => {
        const error = mock((message: string) => `ERR: ${message}`);

        const success = mock((message: string) => `OK: ${message}`);

        const feedbackRenderer: CommandFeedbackRenderer = {
            error,
            success,
        };

        const { message, reply, editReplyMessage } = createMessage();

        const ctx = new CommandContext(message, {}, { feedbackRenderer });

        await ctx.replyError("failed");
        await ctx.replySuccess("worked");

        expect(error).toHaveBeenCalledWith("failed");
        expect(success).toHaveBeenCalledWith("worked");

        expect(reply).toHaveBeenCalledWith(
            expect.objectContaining({
                content: "ERR: failed",
            }),
        );

        expect(editReplyMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                content: "OK: worked",
            }),
        );
    });
});

```

### File: tests/manager.test.ts

```
import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { ChatInputCommandInteraction, Message } from "discord.js";
import { argument } from "@/arguments/builder";
import {
    CommandManager,
    createSlashCommandBuilder,
    defineCommand,
} from "@/manager";

describe("CommandManager", () => {
    let manager: CommandManager;

    beforeEach(() => {
        manager = new CommandManager({ prefix: "!" });
    });

    describe("Command Registration", () => {
        test("validates and stores command properties", () => {
            const cmd = defineCommand({
                name: "ping",
                description: "Pong command",
                aliases: ["p"],
                execute: () => {},
            });

            manager.registerCommands([cmd]);

            expect(manager.commands.has("ping")).toBe(true);
            expect(manager.commands.has("p")).toBe(true);
            expect(manager.commands.get("ping")?.description).toBe(
                "Pong command",
            );
        });

        test("throws error on invalid name", () => {
            const cmd = defineCommand({
                name: "Invalid Name!",
                description: "Test",
                execute: () => {},
            });

            expect(() => manager.registerCommands([cmd])).toThrow();
        });

        test("creates slash command builder properties successfully", () => {
            const cmd = defineCommand({
                name: "test",
                description: "test desc",
                guildOnly: true,
                userPermissions: ["Administrator"],
                execute: () => {},
            });

            const builder = createSlashCommandBuilder(cmd);
            expect(builder).toBeDefined();
            expect(builder.name).toBe("test");
        });
    });

    describe("Execution Handling", () => {
        test("executes message commands correctly with string parsing", async () => {
            const executeMock = mock();
            const cmd = defineCommand({
                name: "echo",
                description: "Echoes text",
                arguments: {
                    text: argument.string({
                        description: "Text to echo",
                        rest: true,
                    }),
                },
                execute: executeMock,
            });

            manager.registerCommands([cmd]);

            const msg = {
                content: "!echo hello world",
                author: { id: "123", bot: false },
                channel: { isTextBased: () => true, isDMBased: () => false },
            } as unknown as Message;

            const handled = await manager.handleMessage(msg);

            expect(handled).toBe(true);
            expect(executeMock).toHaveBeenCalled();
            const ctx = executeMock.mock.calls[0]![0];
            expect(ctx.args.text).toBe("hello world");
        });

        test("ignores messages without configured prefix", async () => {
            const msg = {
                content: "?echo hello",
                author: { id: "123", bot: false },
            } as unknown as Message;

            const handled = await manager.handleMessage(msg);
            expect(handled).toBe(false);
        });

        test("restricts execution to devIds if allowOnlyDevs is true", async () => {
            const devManager = new CommandManager({
                prefix: "!",
                allowOnlyDevs: true,
                devIds: ["dev-1"],
            });

            const executeMock = mock();
            devManager.registerCommands([
                {
                    name: "testcmd",
                    description: "test",
                    execute: executeMock,
                    slash: true,
                },
            ]);

            const baseInteraction = {
                isChatInputCommand: () => true,
                commandName: "testcmd",
                deferred: false,
                replied: false,
                reply: mock().mockResolvedValue(true),
                editReply: mock().mockResolvedValue(true),
                fetchReply: mock().mockResolvedValue(true),
            };

            const strangerInteraction = {
                ...baseInteraction,
                user: { id: "stranger", bot: false },
            } as unknown as ChatInputCommandInteraction;

            const handledStranger =
                await devManager.handleInteraction(strangerInteraction);
            expect(handledStranger).toBe(false);

            const devInteraction = {
                ...baseInteraction,
                user: { id: "dev-1", bot: false },
            } as unknown as ChatInputCommandInteraction;

            const handledDev =
                await devManager.handleInteraction(devInteraction);
            expect(handledDev).toBe(true);
        });

        test("fails if parsed arguments return errors", async () => {
            const executeMock = mock();
            const cmd = defineCommand({
                name: "math",
                description: "Math test",
                arguments: {
                    num: argument.integer({
                        description: "Required int",
                        required: true,
                    }),
                },
                execute: executeMock,
            });

            manager.registerCommands([cmd]);

            const msg = {
                content: "!math not-a-number",
                author: { id: "123", bot: false },
                reply: mock().mockResolvedValue(true),
            } as unknown as Message;

            const handled = await manager.handleMessage(msg);

            expect(handled).toBe(false);
            expect(msg.reply).toHaveBeenCalled();
            expect(executeMock).not.toHaveBeenCalled();
        });
    });
});

```

### File: tsconfig.json

```
{
    "compilerOptions": {
        "baseUrl": ".",
        "paths": {
            "@/*": ["src/*"],
        },

        // Environment setup & latest features
        "lib": ["ESNext"],
        "target": "ESNext",
        "module": "Preserve",
        "moduleDetection": "force",
        "jsx": "react-jsx",
        "allowJs": true,
        "types": ["bun"],

        // Bundler mode
        "moduleResolution": "bundler",
        "allowImportingTsExtensions": true,
        "verbatimModuleSyntax": true,
        "noEmit": true,

        // Best practices
        "strict": true,
        "skipLibCheck": true,
        "noFallthroughCasesInSwitch": true,
        "noUncheckedIndexedAccess": true,
        "noImplicitOverride": true,
        "noImplicitReturns": true,
        "noUnusedParameters": true,
        "noUnusedLocals": true,
        "noPropertyAccessFromIndexSignature": false,
    },
    "include": ["src/**/*", "tests/**/*"],
}

```