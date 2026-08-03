import {
    ComponentType,
    type ButtonInteraction,
    type StringSelectMenuInteraction,
} from "discord.js";
import { argument, type ParsedArguments } from "../arguments";
import type { CommandContext } from "../context";
import { defineCommand, type Command } from "../manager/command";
import type { CommandRoute } from "../manager/route";
import {
    HelpCatalog,
    type HelpCatalogSource,
    type HelpCatalogView,
    type HelpTarget,
} from "./catalog";
import {
    renderHelp,
    renderHelpNotFound,
    toHelpInteractionUpdate,
    type HelpComponentIds,
} from "./renderer";
import type { ResolvedHelpCommandOptions } from "./types";

function createHelpArguments(catalog: HelpCatalog) {
    return {
        command: argument.string({
            description: "Command or command group to inspect.",
            required: false,
            rest: true,
            autocomplete: ({ value, interaction }) =>
                catalog.createView(interaction.user.id).autocomplete(value),
        }),
    } as const;
}

type HelpArgumentSchema = ReturnType<typeof createHelpArguments>;

type HelpArguments = ParsedArguments<HelpArgumentSchema>;

export interface GeneratedHelpDependencies extends HelpCatalogSource {
    resolvePrefix(context: CommandContext<object>): Promise<string>;
}

interface HelpLocation {
    target: HelpTarget | null;
    page: number;
}

function createComponentIds(invocationId: string): HelpComponentIds {
    const base = `voxa:help:${invocationId}`;

    return {
        select: `${base}:select`,
        previous: `${base}:previous`,
        next: `${base}:next`,
        back: `${base}:back`,
        home: `${base}:home`,
    };
}

function stripKnownPrefix(input: string, prefix: string): string {
    const trimmed = input.trim();

    if (prefix && trimmed.startsWith(prefix)) {
        return trimmed.slice(prefix.length).trim();
    }

    return trimmed.replace(/^\/+/, "");
}

class HelpSession {
    private readonly ids: HelpComponentIds;
    private readonly history: HelpLocation[] = [];

    private interactionQueue: Promise<void> = Promise.resolve();

    private location: HelpLocation = {
        target: null,
        page: 0,
    };

    public constructor(
        private readonly context: CommandContext<HelpArguments>,
        private readonly catalog: HelpCatalogView,
        private readonly options: ResolvedHelpCommandOptions,
        private readonly prefix: string,
    ) {
        this.ids = createComponentIds(context.id);
    }

    public async start(query: string | null): Promise<void> {
        const requestedPath = query ? stripKnownPrefix(query, this.prefix) : "";

        if (requestedPath) {
            const target = this.catalog.resolve(requestedPath);

            if (!target) {
                await this.context.reply(
                    renderHelpNotFound(
                        this.options,
                        this.prefix,
                        requestedPath,
                        this.catalog.suggest(requestedPath),
                    ),
                );

                return;
            }

            this.location = {
                target,
                page: 0,
            };
        }

        const message = await this.context.reply(this.createPayload());

        const buttonCollector = this.context.createComponentCollector(message, {
            componentType: ComponentType.Button,
            customIds: [
                this.ids.previous,
                this.ids.next,
                this.ids.back,
                this.ids.home,
            ],
            time: this.options.interactionTimeout,
        });

        const selectCollector = this.context.createComponentCollector(message, {
            componentType: ComponentType.StringSelect,
            customId: this.ids.select,
            time: this.options.interactionTimeout,
        });

        buttonCollector.on("collect", (interaction) => {
            this.enqueueInteraction(interaction, () =>
                this.handleButton(interaction),
            );
        });

        selectCollector.on("collect", (interaction) => {
            this.enqueueInteraction(interaction, () =>
                this.handleSelect(interaction),
            );
        });

        let endedCollectors = 0;

        const handleEnd = (): void => {
            endedCollectors++;

            if (endedCollectors < 2) {
                return;
            }

            void this.context
                .editReply(this.createPayload(true))
                .catch(() => {});
        };

        buttonCollector.once("end", handleEnd);
        selectCollector.once("end", handleEnd);
    }

    private enqueueInteraction(
        interaction: ButtonInteraction | StringSelectMenuInteraction,
        operation: () => Promise<void>,
    ): void {
        this.interactionQueue = this.interactionQueue
            .then(operation)
            .catch(async () => {
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.deferUpdate().catch(() => {});
                }
            });
    }

    private async handleButton(interaction: ButtonInteraction): Promise<void> {
        switch (interaction.customId) {
            case this.ids.previous:
                this.location.page = Math.max(0, this.location.page - 1);
                break;

            case this.ids.next:
                this.location.page = Math.min(
                    this.getPageCount() - 1,
                    this.location.page + 1,
                );
                break;

            case this.ids.back: {
                const previous = this.history.pop();

                if (previous) {
                    this.location = previous;
                }

                break;
            }

            case this.ids.home:
                this.history.push({
                    ...this.location,
                });

                this.location = {
                    target: null,
                    page: 0,
                };
                break;
        }

        await interaction.update(toHelpInteractionUpdate(this.createPayload()));
    }

    private async handleSelect(
        interaction: StringSelectMenuInteraction,
    ): Promise<void> {
        const selectedId = interaction.values[0];

        if (!selectedId) {
            await interaction.deferUpdate();
            return;
        }

        const target = this.catalog.resolveId(selectedId);

        if (!target) {
            await interaction.deferUpdate();
            return;
        }

        this.history.push({
            ...this.location,
        });

        this.location = {
            target,
            page: 0,
        };

        await interaction.update(toHelpInteractionUpdate(this.createPayload()));
    }

    private createPayload(disabled = false) {
        const allEntries = this.getEntries();

        const pageCount = this.getPageCount(allEntries.length);

        this.location.page = Math.min(this.location.page, pageCount - 1);

        const start = this.location.page * this.options.pageSize;

        const entries = allEntries.slice(start, start + this.options.pageSize);

        return renderHelp({
            options: this.options,
            prefix: this.prefix,
            ids: this.ids,
            state: {
                target: this.location.target,
                entries,
                page: this.location.page,
                pageCount,
                canGoBack: this.history.length > 0,
                disabled,
            },
        });
    }

    private getEntries(): readonly HelpTarget[] {
        const target = this.location.target;

        if (target === null) {
            return this.catalog.getRootTargets();
        }

        if (target.kind === "group") {
            return this.catalog.getChildren(target);
        }

        return [];
    }

    private getPageCount(entryCount = this.getEntries().length): number {
        const target = this.location.target;

        if (target?.kind === "command") {
            const argumentCount = Object.keys(
                target.route.command.arguments ?? {},
            ).length;

            const argumentPageSize = Math.min(this.options.pageSize, 5);

            return Math.max(1, Math.ceil(argumentCount / argumentPageSize));
        }

        return Math.max(1, Math.ceil(entryCount / this.options.pageSize));
    }
}

/**
 * Creates the command registered automatically by CommandManager.
 *
 * @internal
 */
export function createGeneratedHelpCommand(
    options: ResolvedHelpCommandOptions,
    dependencies: GeneratedHelpDependencies,
): Command<HelpArgumentSchema> {
    const catalog = new HelpCatalog(dependencies);

    const argumentsSchema = createHelpArguments(catalog);

    return defineCommand({
        name: options.name,
        description: options.description,
        aliases: options.aliases,
        arguments: argumentsSchema,
        slash: options.slash,

        async execute(context) {
            const prefix = await dependencies.resolvePrefix(context);

            const session = new HelpSession(
                context,
                catalog.createView(context.userId),
                options,
                prefix,
            );

            await session.start(context.args.command);
        },
    });
}

/** @internal */
export function createGeneratedHelpRoute(
    options: ResolvedHelpCommandOptions,
    dependencies: GeneratedHelpDependencies,
): CommandRoute {
    const command = createGeneratedHelpCommand(options, dependencies);

    return {
        path: [command.name],
        command,
        groups: [],
    };
}
