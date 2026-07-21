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
