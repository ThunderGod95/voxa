import { ComponentType, } from "discord.js";
import { argument } from "../arguments";
import { defineCommand } from "../manager/command";
import { HelpCatalog, } from "./catalog";
import { renderHelp, renderHelpNotFound, toHelpInteractionUpdate, } from "./renderer";
function createHelpArguments(catalog) {
    return {
        command: argument.string({
            description: "Command or command group to inspect.",
            required: false,
            rest: true,
            autocomplete: ({ value, interaction }) => catalog.createView(interaction.user.id).autocomplete(value),
        }),
    };
}
function createComponentIds(invocationId) {
    const base = `voxa:help:${invocationId}`;
    return {
        select: `${base}:select`,
        previous: `${base}:previous`,
        next: `${base}:next`,
        back: `${base}:back`,
        home: `${base}:home`,
    };
}
function stripKnownPrefix(input, prefix) {
    const trimmed = input.trim();
    if (prefix && trimmed.startsWith(prefix)) {
        return trimmed.slice(prefix.length).trim();
    }
    return trimmed.replace(/^\/+/, "");
}
class HelpSession {
    context;
    catalog;
    options;
    prefix;
    ids;
    history = [];
    interactionQueue = Promise.resolve();
    location = {
        target: null,
        page: 0,
    };
    constructor(context, catalog, options, prefix) {
        this.context = context;
        this.catalog = catalog;
        this.options = options;
        this.prefix = prefix;
        this.ids = createComponentIds(context.id);
    }
    async start(query) {
        const requestedPath = query ? stripKnownPrefix(query, this.prefix) : "";
        if (requestedPath) {
            const target = this.catalog.resolve(requestedPath);
            if (!target) {
                await this.context.reply(renderHelpNotFound(this.options, this.prefix, requestedPath, this.catalog.suggest(requestedPath)));
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
            this.enqueueInteraction(interaction, () => this.handleButton(interaction));
        });
        selectCollector.on("collect", (interaction) => {
            this.enqueueInteraction(interaction, () => this.handleSelect(interaction));
        });
        let endedCollectors = 0;
        const handleEnd = () => {
            endedCollectors++;
            if (endedCollectors < 2) {
                return;
            }
            void this.context
                .editReply(this.createPayload(true))
                .catch(() => { });
        };
        buttonCollector.once("end", handleEnd);
        selectCollector.once("end", handleEnd);
    }
    enqueueInteraction(interaction, operation) {
        this.interactionQueue = this.interactionQueue
            .then(operation)
            .catch(async () => {
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferUpdate().catch(() => { });
            }
        });
    }
    async handleButton(interaction) {
        switch (interaction.customId) {
            case this.ids.previous:
                this.location.page = Math.max(0, this.location.page - 1);
                break;
            case this.ids.next:
                this.location.page = Math.min(this.getPageCount() - 1, this.location.page + 1);
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
    async handleSelect(interaction) {
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
    createPayload(disabled = false) {
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
    getEntries() {
        const target = this.location.target;
        if (target === null) {
            return this.catalog.getRootTargets();
        }
        if (target.kind === "group") {
            return this.catalog.getChildren(target);
        }
        return [];
    }
    getPageCount(entryCount = this.getEntries().length) {
        const target = this.location.target;
        if (target?.kind === "command") {
            const argumentCount = Object.keys(target.route.command.arguments ?? {}).length;
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
export function createGeneratedHelpCommand(options, dependencies) {
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
            const session = new HelpSession(context, catalog.createView(context.userId), options, prefix);
            await session.start(context.args.command);
        },
    });
}
/** @internal */
export function createGeneratedHelpRoute(options, dependencies) {
    const command = createGeneratedHelpCommand(options, dependencies);
    return {
        path: [command.name],
        command,
        groups: [],
    };
}
//# sourceMappingURL=command.js.map