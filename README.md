# Voxa

A strongly typed command framework for Discord.js that provides one command interface for both traditional prefix commands and slash commands.

Voxa handles command loading, argument parsing, validation, permissions, user and role resolution, and command responses while keeping command implementations independent of how they were invoked.

> Voxa is currently intended for personal projects and direct installation from source of GitHub.

## Features

* Unified prefix-command and slash-command interface.
* Strongly typed command arguments.
* Automatic slash-command option generation.
* Prefix argument tokenization with quotes and escapes.
* Required, optional, and rest arguments.
* User, member, and role resolution.
* Guild-only commands.
* User and bot permission checks.
* Command aliases.
* Developer-only command mode.
* Configurable logging and feedback rendering.
* Unified replies, edits, follow-ups, and deferred responses.
* Automatic command loading from a directory.
* Natural-language date and time parsing.
* IANA timezone resolution with city and fuzzy matching.

## Requirements

* Bun
* Typescript 5 or newer
* Discord.js 14.27 or newer

## Installation

Clone the repository and install its dependencies:

```bash
git clone https://github.com/<owner>/voxa.git
cd voxa
bun install
```

For use as a GitHub dependency in another Bun project:

```bash
bun add github:ThunderGod95/voxa
```

## Basic Usage

### Define a command

```typescript
import { argument, defineCommand } from "voxa";

export default defineCommand({
    name: "echo",
    description: "Repeats the provided text.",
    aliases: ["say"],
    
    arguments: {
        text: argument.string({
            description: "The text to repeat",
            required: true,
            rest: true,
        });
    }
    
    async execute(ctx) {
        await ctx.reply(ctx.args.text);
    }
});
```

The same command can be invoked as either:

```markdown
!echo Hello world
```

or

```markdown
/echo text:Hello world
```

In both cases, `ctx.args.text` is inferred as `string`.

## Loading Commands

Commands can be loaded automatically from a directory:

```typescript
import path from "node:path";
import { Client, GatewayIntentBits } from "discord.js";
import { loadCommands } from "voxa";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

const { manager, restPayloads, diagnostics } = await loadCommands({
    directory: path.join(import.meta.dir, "commands"),
    recursive: true,
    prefix: "!",
});

client.on("messageCreate", (message) => {
    void manager.handleMessage(message);
});

client.on("interactionCreate", (interaction) => { 
    if (interaction.isChatInputCommand()) { 
        void manager.handleInteraction(interaction);
    }
});

await client.login(process.env.DISCORD_TOKEN);
```

`restPayloads` contains the generated Discord application-command payloads. Register them using the Discord.js REST client as part of your deployment process.

The loader recognizes commands exported as either:

```typescript
export default defineCommand({
    // ...
})
```

or:

```typescript
export const command = defineCommand({
    // ...
});
```

Files beginning with `_` or `.` and Typescript declaration files are ignored.


## Argument Types

Voxa provides the following argument builders:

| Builder               | Output                         |
| --------------------- | ------------------------------ |
| `argument.string()`   | `string`                       |
| `argument.integer()`  | `number`                       |
| `argument.number()`   | `number`                       |
| `argument.boolean()`  | `boolean`                      |
| `argument.url()`      | `URL`                          |
| `argument.user()`     | `User`                         |
| `argument.member()`   | `GuildMember`                  |
| `argument.role()`     | `Role`                         |
| `argument.timezone()` | Canonical IANA timezone string |
| `argument.time()`     | `Date`                         |

Optional arguments produce `null` when omitted. Required arguments produce their direct output type.

### String arguments

```typescript
arguments: { 
    message: argument.string({ 
        description: "Message content",
        required: true, 
        minLength: 1,
        maxLength: 500,
        rest: true,
    }),
}
```

A rest argument consumes all remaining prefix-command tokens and must be the final argument in the schema.

### Numeric arguments

```typescript
arguments: {
    count: argument.integer({
        description: "Number of messages",
        required: true,
        min: 1,
        max: 100,
    }),
    ratio: argument.number({
        description: "Scaling ratio",
        min: 0,
        max: 1,
    }),
}
```

Integer and number inputs are coerced automatically for prefix commands.

### Boolean arguments

Prefix commands accept common boolean forms:

```text
true
false
yes
no
y
n
1
0
on
off
enable
disable
```

```ts
arguments: {
	enabled: argument.boolean({
		description: "Whether the feature is enabled",
		required: true,
	}),
}
```

### Users and members

```ts
arguments: {
	user: argument.user({
		description: "The Discord user",
		required: true,
	}),

	member: argument.member({
		description: "The server member",
		required: true,
	}),
}
```

For prefix commands, users can be resolved from mentions, IDs, usernames, display names, and supported fuzzy matches.

A member argument can only be used in a server.

### Roles

```ts
arguments: {
	role: argument.role({
		description: "The role to assign",
		required: true,
		allowedRoleIds: ["123456789012345678"],
	}),
}
```

`allowedRoleIds` can restrict an argument to a known set of roles.

### URLs

```ts
arguments: {
	page: argument.url({
		description: "The page URL",
		required: true,
		protocol: /^https:$/,
	}),
}
```

The parsed value is a standard `URL` instance.

## Timezones

Timezone arguments return canonical IANA timezone names:

```ts
arguments: {
	timezone: argument.timezone({
		description: "Your timezone",
		required: true,
		rest: true,
	}),
}
```

Accepted input includes:

```text
Asia/Kolkata
asia kolkata
Kolkata
kolk
kolkta
UTC
SG
```

Example results:

```text
Kolkata  -> Asia/Kolkata
New York -> America/New_York
SG       -> Asia/Singapore
UTC      -> Etc/UTC
```

Two-letter country codes are accepted only when the country has exactly one timezone. Ambiguous country codes such as `US`, `CA`, and `AU` are not guessed.

## Natural-Language Times

Time arguments parse natural-language expressions into `Date` objects:

```ts
arguments: {
	when: argument.time({
		description: "When the reminder should run",
		required: true,
		rest: true,
		timezone: "Asia/Kolkata",
		forwardDate: true,
	}),
}
```

Supported expressions include:

```text
tomorrow at 5pm
next Friday
in three hours
July 30 at 14:00
tonight at 8
```

Available options:

```ts
argument.time({
	description: "When the event begins",

	// Fixed Date or a function evaluated during parsing.
	reference: () => new Date(),

	// Interpret the expression in this IANA timezone.
	timezone: "Asia/Kolkata",

	// Prefer a future date when the expression is ambiguous.
	forwardDate: true,

	// Use stricter parsing rules.
	strict: false,
});
```

The resulting `Date` represents an absolute instant and can be stored, compared, or converted to a Discord timestamp:

```ts
const timestamp = Math.floor(ctx.args.when.getTime() / 1000);

await ctx.reply(`Scheduled for <t:${timestamp}:F>.`);
```

## Command Options

```ts
export default defineCommand({
	name: "manage",
	description: "Performs a management action.",

	aliases: ["m"],

	// Set false to disable the slash-command version.
	slash: true,

	// Reject invocations outside servers.
	guildOnly: true,

	userPermissions: ["ManageMessages"],
	botPermissions: ["SendMessages"],

	arguments: {
		// ...
	},

	async execute(ctx) {
		// ...
	},
});
```

Command and argument names must follow Discord naming restrictions.

Required arguments must appear before optional arguments. Rest arguments must be last.

## Command Context

Every command receives a `CommandContext` containing its typed arguments and invocation information:

```ts
async execute(ctx) {
	ctx.args;

	ctx.raw;
	ctx.message;
	ctx.interaction;

	ctx.user;
	ctx.member;
	ctx.guild;

	ctx.isInteraction;
}
```

The following response methods work for both prefix commands and slash commands:

```ts
await ctx.deferReply();

await ctx.reply("Initial response");

await ctx.editReply("Edits the existing primary response");

await ctx.followUp("Creates a separate follow-up");

await ctx.replySuccess("Operation completed.");

await ctx.replyError("Operation failed.");
```

For interactions, `deferReply(true)` creates an ephemeral deferred response.

## Manager Configuration

```ts
import { CommandManager } from "voxa";

const manager = new CommandManager({
	prefix: "!",

	allowBots: false,

	allowOnlyDevs: false,
	devIds: ["123456789012345678"],

	isIgnored(userId) {
		return false;
	},

	logger: {
		error(message, ...args) {
			console.error(message, ...args);
		},

		warn(message, ...args) {
			console.warn(message, ...args);
		},

		info(message, ...args) {
			console.info(message, ...args);
		},
	},
});
```

The prefix may also be resolved dynamically:

```ts
const manager = new CommandManager({
	async prefix(message) {
		return message.guild ? "!" : "?";
	},
});
```

## Custom Feedback

Voxa uses a configurable feedback renderer for success and error responses.

```typescript
import { CommandManager, createPlainTextFeedbackRenderer, } from "voxa";

const manager = new CommandManager({
    prefix: "!",
    feedbackRenderer: createPlainTextFeedbackRenderer({
        errorPrefix: "Error:",
        successPrefix: "Success:",
    }),
});
```

## Command Events

`CommandManager` extends `EventEmitter` and emits:

```typescript
manager.on("commandStart", (command, context) => {
    // Command execution is beginning.
});
manager.on("commandSuccess", (command, context) => {
    // Command completed successfully.
});
manager.on("commandError", (command, error, context) => {
    // Command execution failed.
});
```

## Design Goals

Voxa is deliberately focused on a small set of responsibilites:

1. Define a command once.
2. Execute it through prefix commands or slash commands.
3. Parse and validate arguments before command execution.
4. Provide the command with strongly typed values.
5. Hide response differences behind a unified context.
6. Keep command implementations independent of Discord transport details.

This framework is designed for internal and personal Discord bot projects rather than as a general-purpose replacement for Discord.js.
