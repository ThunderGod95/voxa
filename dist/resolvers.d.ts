import type { Guild, Message, Role, User } from "discord.js";
export declare function getUserFromInput(input: string, message: Message): Promise<User | undefined>;
export declare function getRoleFromInput(input: string, guild: Guild, allowedRoleIds?: readonly string[]): Role | undefined;
//# sourceMappingURL=resolvers.d.ts.map