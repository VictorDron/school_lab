import { prisma } from "../config/database.js";
import { redis } from "../config/redis.js";
import { createNotification } from "./notification.service.js";
import logger from "../utils/logger.js";

interface ParsedMention {
  type: "user" | "here" | "channel";
  displayName?: string;
}

export function parseMentions(content: string): ParsedMention[] {
  const mentions: ParsedMention[] = [];
  const seen = new Set<string>();

  const addMention = (mention: ParsedMention) => {
    const key = `${mention.type}:${mention.displayName?.trim().toLowerCase() ?? ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    mentions.push(mention);
  };

  const bracketMentionRegex = /@\[([^\]]+)\]/g;
  let bracketMatch: RegExpExecArray | null;

  while ((bracketMatch = bracketMentionRegex.exec(content)) !== null) {
    const displayName = bracketMatch[1].trim();
    if (displayName) {
      addMention({ type: "user", displayName });
    }
  }

  if (content.includes("@here")) {
    addMention({ type: "here" });
  }
  if (content.includes("@channel")) {
    addMention({ type: "channel" });
  }

  // Legacy mentions keep support for simple usernames without bracket syntax.
  const userMentionRegex = /(^|[\s(])@([A-Za-z0-9_]+)/g;
  let match: RegExpExecArray | null;
  while ((match = userMentionRegex.exec(content)) !== null) {
    const name = match[2];
    if (name !== "here" && name !== "channel") {
      addMention({ type: "user", displayName: name });
    }
  }

  return mentions;
}

export async function resolveUserMentions(
  mentions: ParsedMention[],
  channelId: string,
): Promise<{ type: string; userId?: string }[]> {
  const resolved: { type: string; userId?: string }[] = [];
  const normalizeDisplayName = (value: string) =>
    value.trim().replace(/\s+/g, " ").toLocaleLowerCase();

  const channelMembers = await prisma.channelMember.findMany({
    where: { channelId },
    select: { userId: true, user: { select: { displayName: true } } },
  });

  for (const mention of mentions) {
    if (mention.type === "here") {
      // Resolve to online users in channel
      const onlineStates = await Promise.all(
        channelMembers.map(async (member) => ({
          userId: member.userId,
          isOnline: await redis.get(`user:online:${member.userId}`),
        })),
      );

      for (const member of onlineStates) {
        if (member.isOnline === "true") {
          resolved.push({ type: "here", userId: member.userId });
        }
      }
    } else if (mention.type === "channel") {
      // Resolve to all members
      for (const member of channelMembers) {
        resolved.push({ type: "channel", userId: member.userId });
      }
    } else if (mention.type === "user" && mention.displayName) {
      // Find user by displayName
      const member = channelMembers.find(
        (m) =>
          normalizeDisplayName(m.user.displayName) ===
          normalizeDisplayName(mention.displayName!),
      );
      if (member) {
        resolved.push({ type: "user", userId: member.userId });
      }
    }
  }

  // Deduplicate by userId
  const seen = new Set<string>();
  return resolved.filter((m) => {
    if (!m.userId || seen.has(m.userId)) return false;
    seen.add(m.userId);
    return true;
  });
}

export async function notifyMentionedUsers(
  resolvedMentions: { type: string; userId?: string }[],
  message: { id: string; content: string; channelId: string },
  senderName: string,
  channelName: string,
) {
  for (const mention of resolvedMentions) {
    if (!mention.userId) continue;

    try {
      await createNotification({
        userId: mention.userId,
        type: "message_mention",
        title: "Você foi mencionado",
        message: `${senderName} mencionou você em #${channelName}`,
        data: {
          messageId: message.id,
          channelId: message.channelId,
          preview: message.content.substring(0, 100),
        },
      });
    } catch (error) {
      logger.error(
        `Failed to notify mention for user ${mention.userId}:`,
        error,
      );
    }
  }
}
