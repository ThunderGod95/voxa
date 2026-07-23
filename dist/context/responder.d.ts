import { type Message } from "discord.js";
import type { CommandLogger } from "./logger";
import { type CommandReplyPayload } from "./reply";
import type { CommandSource } from "./source";
export interface CommandResponder {
    deferReply(ephemeral?: boolean): Promise<void>;
    editReply(payload: CommandReplyPayload): Promise<Message>;
    followUp(payload: CommandReplyPayload): Promise<Message>;
}
export declare function createCommandResponder(source: CommandSource, logger: CommandLogger): CommandResponder;
//# sourceMappingURL=responder.d.ts.map