import {
    ButtonStyle,
    type InteractionUpdateOptions,
    inlineCode,
    MessageFlags,
    quote,
    SeparatorSpacingSize,
} from "discord.js";
import { component } from "../components";
import type { CommandReplyOptions } from "../context";
import type { HelpCommandTarget, HelpGroupTarget, HelpTarget } from "./catalog";
import {
    escapeInlineCode,
    formatAccess,
    formatAliases,
    formatArgumentEntries,
    formatCommandPath,
    formatMessageDefaultUsage,
    formatMessageUsage,
    formatTargetLabel,
} from "./format";
import type { ResolvedHelpCommandOptions } from "./types";

export interface HelpComponentIds {
    select: string;
    previous: string;
    next: string;
    back: string;
    home: string;
}

export interface HelpPageState {
    target: HelpTarget | null;
    entries: readonly HelpTarget[];
    page: number;
    pageCount: number;
    canGoBack: boolean;
    disabled?: boolean;
}

export interface HelpRenderContext {
    options: ResolvedHelpCommandOptions;
    prefix: string;
    ids: HelpComponentIds;
    state: HelpPageState;
}

function truncate(value: string, maximumLength: number): string {
    if (value.length <= maximumLength) {
        return value;
    }

    return `${value.slice(0, Math.max(0, maximumLength - 1)).trimEnd()}…`;
}

function formatEntry(target: HelpTarget): string {
    const count =
        target.kind === "group"
            ? ` • ${target.routes.length} command${
                  target.routes.length === 1 ? "" : "s"
              }`
            : "";

    return [
        `### ${formatTargetLabel(target.path)}`,
        `${target.description}${count}`,
    ].join("\n");
}

function addNavigation(
    container: ReturnType<typeof component.container>,
    context: HelpRenderContext,
): void {
    const { entries, page, pageCount, canGoBack, disabled } = context.state;

    if (entries.length > 0) {
        container.actionRow((row) => {
            row.stringSelect((select) =>
                select
                    .setCustomId(context.ids.select)
                    .setPlaceholder("Open a command or command group")
                    .setDisabled(disabled ?? false)
                    .addOptions(
                        entries.map((entry) => ({
                            label: truncate(formatCommandPath(entry.path), 100),
                            description: truncate(entry.description, 100),
                            value: entry.id,
                        })),
                    ),
            );

            return row;
        });
    }

    const needsButtons =
        pageCount > 1 || canGoBack || context.state.target !== null;

    if (!needsButtons) {
        return;
    }

    container.actionRow((row) => {
        if (pageCount > 1) {
            row.button({
                customId: context.ids.previous,
                label: "Previous",
                style: ButtonStyle.Secondary,
                disabled: disabled || page <= 0,
            });

            row.button({
                customId: context.ids.next,
                label: "Next",
                style: ButtonStyle.Secondary,
                disabled: disabled || page >= pageCount - 1,
            });
        }

        if (canGoBack) {
            row.button({
                customId: context.ids.back,
                label: "Back",
                style: ButtonStyle.Secondary,
                disabled: disabled,
            });
        }

        if (context.state.target !== null) {
            row.button({
                customId: context.ids.home,
                label: "All commands",
                style: ButtonStyle.Primary,
                disabled: disabled,
            });
        }

        return row;
    });
}

function renderOverview(
    context: HelpRenderContext,
): ReturnType<typeof component.container> {
    const container = component.container();

    if (context.options.accentColor !== null) {
        container.accentColor(context.options.accentColor);
    }

    container
        .text(
            `## ${context.options.title}\n` +
                `${context.options.intro}\n\n` +
                `Open an entry below, or use ` +
                `\`${escapeInlineCode(context.prefix)}` +
                `${context.options.name} <command>\` ` +
                "for direct lookup.",
        )
        .separator({
            spacing: SeparatorSpacingSize.Large,
            divider: true,
        });

    container.text(
        context.state.entries.length > 0
            ? context.state.entries.map(formatEntry).join("\n\n")
            : "No commands are currently available.",
    );

    container.separator({
        spacing: SeparatorSpacingSize.Large,
        divider: true,
    });

    container.text(
        `-# Page ${context.state.page + 1} of ` +
            `${Math.max(1, context.state.pageCount)}`,
    );

    addNavigation(container, context);

    return container;
}

function renderGroup(
    context: HelpRenderContext,
    target: HelpGroupTarget,
): ReturnType<typeof component.container> {
    const container = component.container();

    if (context.options.accentColor !== null) {
        container.accentColor(context.options.accentColor);
    }

    container
        .text(
            `## ${formatTargetLabel(target.path)}\n` +
                `${target.description}\n\n` +
                `${target.routes.length} registered command${
                    target.routes.length === 1 ? "" : "s"
                } in this group.`,
        )
        .separator({
            spacing: SeparatorSpacingSize.Large,
            divider: true,
        });

    container.text(
        context.state.entries.length > 0
            ? context.state.entries.map(formatEntry).join("\n\n")
            : "This command group contains no visible commands.",
    );

    container.separator({
        spacing: SeparatorSpacingSize.Large,
        divider: true,
    });

    container.text(
        `-# Page ${context.state.page + 1} of ` +
            `${Math.max(1, context.state.pageCount)}`,
    );

    addNavigation(container, context);

    return container;
}

function renderCommand(
    context: HelpRenderContext,
    target: HelpCommandTarget,
): ReturnType<typeof component.container> {
    const route = target.route;

    const defaultUsage = formatMessageDefaultUsage(route, context.prefix);
    const argumentEntries = formatArgumentEntries(
        route.command.arguments ?? {},
    );

    const argumentPageSize = Math.min(context.options.pageSize, 5);
    const argumentStart = context.state.page * argumentPageSize;
    const visibleArguments = argumentEntries.slice(
        argumentStart,
        argumentStart + argumentPageSize,
    );

    const aliases = formatAliases(route);
    const access = formatAccess(route);

    const container = component.container();

    if (context.options.accentColor !== null) {
        container.accentColor(context.options.accentColor);
    }

    const headerText = [
        `## ${formatTargetLabel(route.path)}`,
        quote(route.command.description),
        "",
        aliases,
    ]
        .filter((line): line is string => line !== null)
        .join("\n");

    container
        .text(headerText)
        .separator({
            spacing: SeparatorSpacingSize.Large,
            divider: true,
        })
        .text(
            [
                "### Syntax",
                inlineCode(formatMessageUsage(route, context.prefix)),
                defaultUsage
                    ? `**Message default:** \`${escapeInlineCode(defaultUsage)}\``
                    : null,
                "",
                `${inlineCode("<>")} required • ${inlineCode("[]")} optional`,
            ]
                .filter((line): line is string => line !== null)
                .join("\n"),
        );

    if (visibleArguments.length > 0) {
        const rangeEnd = argumentStart + visibleArguments.length;
        let argumentsText = `## Arguments\n${visibleArguments.join("\n\n")}`;

        if (argumentEntries.length > argumentPageSize) {
            argumentsText += `\n\n-# Showing ${argumentStart + 1}–${rangeEnd} of ${argumentEntries.length}`;
        }

        container
            .separator({
                spacing: SeparatorSpacingSize.Large,
                divider: true,
            })
            .text(argumentsText);
    }

    if (access) {
        container
            .separator({
                spacing: SeparatorSpacingSize.Large,
                divider: true,
            })
            .text(access);
    }

    addNavigation(container, context);

    return container;
}

export function renderHelpNotFound(
    options: ResolvedHelpCommandOptions,
    prefix: string,
    requestedPath: string,
    suggestions: readonly HelpTarget[],
): CommandReplyOptions {
    const suggestionText =
        suggestions.length > 0
            ? `\n\n**Did you mean:** ${suggestions
                  .map(
                      (target) =>
                          `\`${escapeInlineCode(formatCommandPath(target.path))}\``,
                  )
                  .join(", ")}`
            : "";

    const container = component.container();

    if (options.accentColor !== null) {
        container.accentColor(options.accentColor);
    }

    container.text(
        "## Command not found\n" +
            "No command or command group named " +
            `\`${escapeInlineCode(requestedPath)}\` ` +
            `exists.${suggestionText}\n\n` +
            `Use \`${escapeInlineCode(prefix)}` +
            `${options.name}\` to browse all commands.`,
    );

    return {
        ephemeral: options.ephemeral,
        components: [container],
    };
}

export function renderHelp(context: HelpRenderContext): CommandReplyOptions {
    const target = context.state.target;

    const container =
        target === null
            ? renderOverview(context)
            : target.kind === "group"
              ? renderGroup(context, target)
              : renderCommand(context, target);

    return {
        ephemeral: context.options.ephemeral,
        components: [container],
    };
}

export function toHelpInteractionUpdate(
    payload: CommandReplyOptions,
): InteractionUpdateOptions {
    if (payload.components === undefined) {
        throw new Error("Help views must use Components v2.");
    }

    return {
        components: payload.components,
        flags: MessageFlags.IsComponentsV2,
    };
}
