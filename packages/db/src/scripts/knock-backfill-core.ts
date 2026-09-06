import { z } from "zod";

/**
 * The pure half of the Knock → `Notification` backfill: page parsing, the
 * per-message mapping, the merge onto the table's key and the check report.
 * `knock-backfill.ts` is the runner that owns `fetch` and the database.
 */

/** What Knock's `new-comment` trigger stored on every message. Frozen: it
    describes data already at Knock, so it must not follow
    `newCommentNotificationData` in `@repo/contracts` if the live push payload
    ever changes. */
const knockNewCommentData = z.object({
  parentPostId: z.string().min(1),
  commentPostId: z.string().min(1),
});

/** Knock returns a recipient either as a bare id or as `{ id, collection }`. */
const knockRecipient = z.union([
  z.string().min(1),
  z.object({ id: z.string().min(1) }).transform((recipient) => recipient.id),
]);

const knockMessage = z.object({
  id: z.string().min(1),
  recipient: knockRecipient,
  data: z.unknown(),
  read_at: z.string().nullable(),
  archived_at: z.string().nullable(),
  inserted_at: z.string(),
});
export type KnockMessage = z.infer<typeof knockMessage>;

/** `GET /v1/messages`. Knock returns `items`, not `entries` (that is the feed API). */
export const knockMessagesPage = z.object({
  items: z.array(knockMessage),
  page_info: z.object({ after: z.string().nullable() }),
});
export type KnockMessagesPage = z.infer<typeof knockMessagesPage>;

export const KNOCK_MESSAGES_URL = "https://api.knock.app/v1/messages";
export const KNOCK_WORKFLOW_KEY = "new-comment";
export const KNOCK_PAGE_SIZE = 50;

export const knockMessagesPageUrl = (after: string | null): string => {
  const url = new URL(KNOCK_MESSAGES_URL);
  url.searchParams.set("source", KNOCK_WORKFLOW_KEY);
  url.searchParams.set("page_size", String(KNOCK_PAGE_SIZE));
  if (after !== null) url.searchParams.set("after", after);
  return url.toString();
};

export type FetchKnockPage = (after: string | null) => Promise<KnockMessagesPage>;

/** Follows `page_info.after` until Knock returns null. */
export const fetchAllKnockMessages = async (fetchPage: FetchKnockPage): Promise<KnockMessage[]> => {
  const messages: KnockMessage[] = [];
  const seenCursors = new Set<string>();
  let after: string | null = null;

  do {
    const page: KnockMessagesPage = await fetchPage(after);
    messages.push(...page.items);
    after = page.page_info.after;
    if (after !== null) {
      // A repeated cursor would page forever; fail instead.
      if (seenCursors.has(after)) throw new Error(`Knock returned cursor ${after} twice`);
      seenCursors.add(after);
    }
  } while (after !== null);

  return messages;
};

export type ExistingPost = {
  parentId: string | null;
  createdBy: string | null;
  userId: string;
};
export type FindPost = (postId: string) => ExistingPost | undefined;

export type NotificationRow = {
  id: string;
  userId: string;
  kind: "COMMENT";
  postId: string;
  commentId: string;
  actorName: string;
  readAt: string | null;
  createdAt: string;
};

export const SKIP_REASONS = [
  "archived",
  "malformed-data",
  "comment-missing",
  "letter-missing",
  "not-a-reply-to-letter",
  "recipient-not-letter-author",
  "invalid-timestamp",
] as const;
export type SkipReason = (typeof SKIP_REASONS)[number];

export type SkippedMessage = { messageId: string; reason: SkipReason };

export type MappedMessage =
  | { kind: "row"; row: NotificationRow }
  | { kind: "skip"; skipped: SkippedMessage };

export type MapDependencies = {
  findPost: FindPost;
  newId: () => string;
};

const toIsoTimestamp = (value: string): string | null => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const skip = (messageId: string, reason: SkipReason): MappedMessage => ({
  kind: "skip",
  skipped: { messageId, reason },
});

export const mapKnockMessage = (message: KnockMessage, deps: MapDependencies): MappedMessage => {
  if (message.archived_at !== null) return skip(message.id, "archived");

  const data = knockNewCommentData.safeParse(message.data);
  if (!data.success) return skip(message.id, "malformed-data");

  const comment = deps.findPost(data.data.commentPostId);
  if (comment === undefined) return skip(message.id, "comment-missing");
  const letter = deps.findPost(data.data.parentPostId);
  if (letter === undefined) return skip(message.id, "letter-missing");
  if (comment.parentId !== data.data.parentPostId) return skip(message.id, "not-a-reply-to-letter");
  // The recipient column is a foreign key; a row for anyone but the letter's
  // author would fail the whole batch, not just this message.
  if (letter.userId !== message.recipient) return skip(message.id, "recipient-not-letter-author");

  const createdAt = toIsoTimestamp(message.inserted_at);
  if (createdAt === null) return skip(message.id, "invalid-timestamp");
  const readAt = message.read_at === null ? null : toIsoTimestamp(message.read_at);
  if (message.read_at !== null && readAt === null) return skip(message.id, "invalid-timestamp");

  return {
    kind: "row",
    row: {
      id: deps.newId(),
      userId: message.recipient,
      kind: "COMMENT",
      postId: data.data.parentPostId,
      commentId: data.data.commentPostId,
      actorName: comment.createdBy ?? "Anonymous",
      readAt,
      createdAt,
    },
  };
};

const earliest = (a: string | null, b: string | null): string | null => {
  if (a === null) return b;
  if (b === null) return a;
  return a < b ? a : b;
};

/** Knock stores one message per channel — the in-app feed row and the push —
    for the same comment, and only the feed row carries read state. The table
    keys on (recipient, comment), so they merge here: read wins, earliest
    creation wins. */
export const collapseRows = (rows: NotificationRow[]): NotificationRow[] => {
  const byKey = new Map<string, NotificationRow>();
  for (const row of rows) {
    const key = `${row.userId}:${row.commentId}`;
    const existing = byKey.get(key);
    if (existing === undefined) {
      byKey.set(key, row);
      continue;
    }
    byKey.set(key, {
      ...existing,
      readAt: earliest(existing.readAt, row.readAt),
      createdAt: existing.createdAt < row.createdAt ? existing.createdAt : row.createdAt,
    });
  }
  return [...byKey.values()];
};

export type BackfillPlan = { rows: NotificationRow[]; skipped: SkippedMessage[] };

export const planBackfill = (messages: KnockMessage[], deps: MapDependencies): BackfillPlan => {
  const rows: NotificationRow[] = [];
  const skipped: SkippedMessage[] = [];
  for (const message of messages) {
    const mapped = mapKnockMessage(message, deps);
    if (mapped.kind === "row") rows.push(mapped.row);
    else skipped.push(mapped.skipped);
  }
  return { rows: collapseRows(rows), skipped };
};

export const countSkipsByReason = (skipped: SkippedMessage[]): Map<SkipReason, number> => {
  const counts = new Map<SkipReason, number>();
  for (const entry of skipped) counts.set(entry.reason, (counts.get(entry.reason) ?? 0) + 1);
  return counts;
};

export type RecipientCount = { userId: string; count: number };
export type RecipientDiscrepancy = { userId: string; knock: number; table: number };

/** Recipients whose Knock row count differs from the table's. After cutover the
    table legitimately grows past Knock (new comments never reach Knock), so the
    runner reports `knock > table` and `table > knock` separately. */
export const compareRecipientCounts = (
  rows: NotificationRow[],
  tableCounts: RecipientCount[],
): RecipientDiscrepancy[] => {
  const knock = new Map<string, number>();
  for (const row of rows) knock.set(row.userId, (knock.get(row.userId) ?? 0) + 1);
  const table = new Map(tableCounts.map((entry) => [entry.userId, entry.count]));

  return [...new Set([...knock.keys(), ...table.keys()])]
    .map((userId) => ({ userId, knock: knock.get(userId) ?? 0, table: table.get(userId) ?? 0 }))
    .filter((entry) => entry.knock !== entry.table)
    .toSorted((a, b) => a.userId.localeCompare(b.userId));
};
