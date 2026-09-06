/**
 * Copies Knock's `new-comment` feed into the `Notification` table.
 *
 * Idempotent on (userId, commentId): run it before the deploy that turns Knock
 * off and again right after, so nothing that landed in between is lost, then
 * `--check` to compare per-recipient counts and list what was skipped.
 *
 *   pnpm -F db knock-backfill                # write
 *   pnpm -F db knock-backfill --check        # report only
 *   pnpm -F db knock-backfill --from-posts   # no Knock: one unread row per existing comment
 *
 * Reads KNOCK_API_KEY (not for --from-posts) and POSTGRES_URL from .env; the
 * `knock-backfill:remote` script reads them from .env.production.local instead.
 */
import { randomUUID } from "node:crypto";

import { count, eq, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "../drizzle-client";
import { notification, post } from "../drizzle-schema";
import {
  compareRecipientCounts,
  countSkipsByReason,
  fetchAllKnockMessages,
  knockMessagesPage,
  knockMessagesPageUrl,
  planBackfill,
  type BackfillPlan,
  type FetchKnockPage,
  type FindPost,
  type NotificationRow,
} from "./knock-backfill-core";

type Mode = "write" | "check" | "from-posts";

const WRITE_BATCH_SIZE = 500;

const parseMode = (args: string[]): Mode => {
  const flags = new Set(args);
  const unknown = args.filter((arg) => arg !== "--check" && arg !== "--from-posts");
  if (unknown.length > 0 || (flags.has("--check") && flags.has("--from-posts"))) {
    throw new Error("Usage: knock-backfill [--check | --from-posts]");
  }
  if (flags.has("--check")) return "check";
  if (flags.has("--from-posts")) return "from-posts";
  return "write";
};

const createKnockFetch = (apiKey: string): FetchKnockPage => {
  return async (after) => {
    const response = await fetch(knockMessagesPageUrl(after), {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) throw new Error(`Knock responded ${response.status}`);
    return knockMessagesPage.parse(await response.json());
  };
};

const loadPosts = async (): Promise<FindPost> => {
  const rows = await db
    .select({
      id: post.id,
      parentId: post.parentId,
      createdBy: post.createdBy,
      userId: post.userId,
    })
    .from(post);
  const byId = new Map(rows.map((row) => [row.id, row]));
  return (postId) => byId.get(postId);
};

const loadPlan = async (): Promise<{ fetched: number; plan: BackfillPlan }> => {
  const apiKey = process.env.KNOCK_API_KEY;
  if (apiKey === undefined || apiKey.trim().length === 0) {
    throw new Error("Missing KNOCK_API_KEY");
  }
  const messages = await fetchAllKnockMessages(createKnockFetch(apiKey));
  console.log(`Fetched ${messages.length} Knock message(s)`);
  const findPost = await loadPosts();
  return {
    fetched: messages.length,
    plan: planBackfill(messages, { findPost, newId: randomUUID }),
  };
};

const printSkipped = (plan: BackfillPlan) => {
  for (const [reason, total] of countSkipsByReason(plan.skipped)) {
    console.log(`  skipped ${total} — ${reason}`);
  }
};

const writeRows = async (
  rows: NotificationRow[],
): Promise<{ inserted: number; updated: number }> => {
  let inserted = 0;
  let updated = 0;
  for (let index = 0; index < rows.length; index += WRITE_BATCH_SIZE) {
    const results = await db
      .insert(notification)
      .values(rows.slice(index, index + WRITE_BATCH_SIZE))
      .onConflictDoUpdate({
        target: [notification.userId, notification.commentId],
        // A read in either source stays read; the timestamp follows Knock.
        set: {
          readAt: sql`coalesce(excluded."readAt", ${notification.readAt})`,
          createdAt: sql`excluded."createdAt"`,
        },
      })
      // xmax is 0 on a freshly inserted tuple and non-zero on one the upsert updated.
      .returning({ inserted: sql<boolean>`(xmax = 0)` });
    for (const result of results) {
      if (result.inserted) inserted += 1;
      else updated += 1;
    }
  }
  return { inserted, updated };
};

const write = async () => {
  const { fetched, plan } = await loadPlan();
  const { inserted, updated } = await writeRows(plan.rows);
  console.log(
    `Fetched ${fetched}, wrote ${inserted}, updated ${updated}, skipped ${plan.skipped.length}`,
  );
  printSkipped(plan);
};

const check = async () => {
  const { fetched, plan } = await loadPlan();
  const tableCounts = await db
    .select({ userId: notification.userId, count: count() })
    .from(notification)
    .groupBy(notification.userId);
  const discrepancies = compareRecipientCounts(plan.rows, tableCounts);
  const missing = discrepancies.filter((entry) => entry.knock > entry.table);
  const extra = discrepancies.filter((entry) => entry.table > entry.knock);

  console.log(
    `Fetched ${fetched}: ${plan.rows.length} row(s) expected, ${plan.skipped.length} skipped, ${discrepancies.length} recipient(s) differ`,
  );
  for (const entry of missing) {
    console.log(`  MISSING ${entry.userId}: knock ${entry.knock}, table ${entry.table}`);
  }
  for (const entry of extra) {
    console.log(
      `  extra (fine after cutover) ${entry.userId}: knock ${entry.knock}, table ${entry.table}`,
    );
  }
  printSkipped(plan);
  for (const entry of plan.skipped) console.log(`  ${entry.messageId}: ${entry.reason}`);
  if (missing.length > 0) process.exitCode = 1;
};

/** Rollback and seed fallback: every existing comment on someone else's letter
    gets an unread row, dated with the comment. Never touches an existing row. */
const fromPosts = async () => {
  const letter = alias(post, "letter");
  const written = await db
    .insert(notification)
    .select(
      db
        .select({
          id: sql`gen_random_uuid()::text`.as("id"),
          userId: letter.userId,
          kind: sql`'COMMENT'::"NotificationKind"`.as("kind"),
          postId: letter.id,
          commentId: post.id,
          actorName: sql`coalesce(${post.createdBy}, 'Anonymous')`.as("actorName"),
          readAt: sql`null::timestamp(3)`.as("readAt"),
          createdAt: post.createdAt,
        })
        .from(post)
        .innerJoin(letter, eq(post.parentId, letter.id))
        .where(ne(post.userId, letter.userId)),
    )
    .onConflictDoNothing({ target: [notification.userId, notification.commentId] })
    .returning({ id: notification.id });
  console.log(`Wrote ${written.length} notification(s) from posts`);
};

const runners = { write, check, "from-posts": fromPosts } satisfies Record<
  Mode,
  () => Promise<void>
>;

try {
  await runners[parseMode(process.argv.slice(2))]();
} finally {
  await db.$client.end();
}
