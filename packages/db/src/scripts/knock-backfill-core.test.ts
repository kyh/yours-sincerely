import assert from "node:assert/strict";
import { test } from "node:test";

import {
  collapseRows,
  compareRecipientCounts,
  countSkipsByReason,
  fetchAllKnockMessages,
  knockMessagesPage,
  knockMessagesPageUrl,
  mapKnockMessage,
  planBackfill,
  type ExistingPost,
  type KnockMessage,
  type KnockMessagesPage,
  type MapDependencies,
} from "./knock-backfill-core";

const AUTHOR = "author-1";
const COMMENTER = "commenter-1";
const LETTER = "letter-1";
const COMMENT = "comment-1";

const posts = new Map<string, ExistingPost>([
  [LETTER, { parentId: null, createdBy: "Author", userId: AUTHOR }],
  [COMMENT, { parentId: LETTER, createdBy: "Commenter", userId: COMMENTER }],
  ["orphan-comment", { parentId: "letter-gone", createdBy: "Commenter", userId: COMMENTER }],
  ["other-letter", { parentId: null, createdBy: "Other", userId: "other-1" }],
]);

const createDeps = (): MapDependencies => {
  let next = 0;
  return {
    findPost: (postId) => posts.get(postId),
    newId: () => `id-${(next += 1)}`,
  };
};

const message = (overrides: Partial<KnockMessage> = {}): KnockMessage => ({
  id: "msg-1",
  recipient: AUTHOR,
  data: { parentPostId: LETTER, commentPostId: COMMENT },
  read_at: null,
  archived_at: null,
  inserted_at: "2026-01-02T03:04:05.678Z",
  ...overrides,
});

test("maps a feed message onto a notification row", () => {
  const mapped = mapKnockMessage(message({ read_at: "2026-01-03T00:00:00Z" }), createDeps());
  assert.deepEqual(mapped, {
    kind: "row",
    row: {
      id: "id-1",
      userId: AUTHOR,
      kind: "COMMENT",
      postId: LETTER,
      commentId: COMMENT,
      actorName: "Commenter",
      readAt: "2026-01-03T00:00:00.000Z",
      createdAt: "2026-01-02T03:04:05.678Z",
    },
  });
});

test("an anonymous commenter is named Anonymous", () => {
  const deps: MapDependencies = {
    ...createDeps(),
    findPost: (postId) =>
      postId === COMMENT
        ? { parentId: LETTER, createdBy: null, userId: COMMENTER }
        : posts.get(postId),
  };
  const mapped = mapKnockMessage(message(), deps);
  assert.equal(mapped.kind, "row");
  if (mapped.kind === "row") assert.equal(mapped.row.actorName, "Anonymous");
});

test("recipient may arrive as an object reference", () => {
  const page = knockMessagesPage.parse({
    items: [{ ...message(), recipient: { id: AUTHOR, collection: "users" } }],
    page_info: { after: null },
  });
  assert.equal(page.items[0]?.recipient, AUTHOR);
});

test("skips, with the reason, everything that cannot become a row", () => {
  const cases: [KnockMessage, string][] = [
    [message({ archived_at: "2026-02-01T00:00:00Z" }), "archived"],
    [message({ data: { parentPostId: LETTER } }), "malformed-data"],
    [message({ data: { parentPostId: LETTER, commentPostId: "comment-gone" } }), "comment-missing"],
    [
      message({ data: { parentPostId: "letter-gone", commentPostId: "orphan-comment" } }),
      "letter-missing",
    ],
    [
      message({ data: { parentPostId: "other-letter", commentPostId: COMMENT } }),
      "not-a-reply-to-letter",
    ],
    [message({ recipient: "someone-else" }), "recipient-not-letter-author"],
    [message({ inserted_at: "not a date" }), "invalid-timestamp"],
    [message({ read_at: "not a date" }), "invalid-timestamp"],
  ];
  for (const [input, reason] of cases) {
    assert.deepEqual(mapKnockMessage(input, createDeps()), {
      kind: "skip",
      skipped: { messageId: "msg-1", reason },
    });
  }
});

test("collapses the feed and push messages for one comment into one row", () => {
  const plan = planBackfill(
    [
      message({ id: "push", inserted_at: "2026-01-02T03:04:06Z" }),
      message({ id: "feed", read_at: "2026-01-05T00:00:00Z", inserted_at: "2026-01-02T03:04:05Z" }),
    ],
    createDeps(),
  );
  assert.equal(plan.rows.length, 1);
  assert.equal(plan.rows[0]?.readAt, "2026-01-05T00:00:00.000Z");
  assert.equal(plan.rows[0]?.createdAt, "2026-01-02T03:04:05.000Z");
  assert.deepEqual(plan.skipped, []);
});

test("collapse keeps the earliest read time and keeps distinct comments apart", () => {
  const base = {
    id: "x",
    userId: AUTHOR,
    kind: "COMMENT",
    postId: LETTER,
    actorName: "Commenter",
  } as const;
  const rows = collapseRows([
    {
      ...base,
      commentId: "a",
      readAt: "2026-01-09T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      ...base,
      commentId: "a",
      readAt: "2026-01-08T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    { ...base, commentId: "b", readAt: null, createdAt: "2026-01-02T00:00:00.000Z" },
  ]);
  assert.deepEqual(
    rows.map((row) => [row.commentId, row.readAt]),
    [
      ["a", "2026-01-08T00:00:00.000Z"],
      ["b", null],
    ],
  );
});

test("counts skips by reason", () => {
  const counts = countSkipsByReason([
    { messageId: "1", reason: "archived" },
    { messageId: "2", reason: "archived" },
    { messageId: "3", reason: "comment-missing" },
  ]);
  assert.deepEqual(
    [...counts.entries()],
    [
      ["archived", 2],
      ["comment-missing", 1],
    ],
  );
});

test("builds the messages URL with and without a cursor", () => {
  assert.equal(
    knockMessagesPageUrl(null),
    "https://api.knock.app/v1/messages?source=new-comment&page_size=50",
  );
  assert.equal(
    knockMessagesPageUrl("cur sor"),
    "https://api.knock.app/v1/messages?source=new-comment&page_size=50&after=cur+sor",
  );
});

test("follows the after cursor until it is null", async () => {
  const pages = new Map<string | null, KnockMessagesPage>([
    [null, { items: [message({ id: "1" })], page_info: { after: "c1" } }],
    ["c1", { items: [message({ id: "2" })], page_info: { after: "c2" } }],
    ["c2", { items: [message({ id: "3" })], page_info: { after: null } }],
  ]);
  const requested: (string | null)[] = [];
  const messages = await fetchAllKnockMessages(async (after) => {
    requested.push(after);
    const page = pages.get(after);
    if (page === undefined) throw new Error(`unexpected cursor ${after}`);
    return page;
  });
  assert.deepEqual(requested, [null, "c1", "c2"]);
  assert.deepEqual(
    messages.map((entry) => entry.id),
    ["1", "2", "3"],
  );
});

test("refuses a cursor loop", async () => {
  await assert.rejects(
    fetchAllKnockMessages(async () => ({ items: [], page_info: { after: "same" } })),
    /cursor same twice/,
  );
});

test("rejects a page that is not the messages API shape", () => {
  assert.equal(
    knockMessagesPage.safeParse({ entries: [], page_info: { after: null } }).success,
    false,
  );
});

test("reports only recipients whose counts differ", () => {
  const plan = planBackfill(
    [
      message({ id: "1" }),
      message({ id: "2", data: { parentPostId: LETTER, commentPostId: COMMENT } }),
    ],
    createDeps(),
  );
  const discrepancies = compareRecipientCounts(plan.rows, [
    { userId: AUTHOR, count: 1 },
    { userId: "someone-new", count: 3 },
  ]);
  assert.deepEqual(discrepancies, [{ userId: "someone-new", knock: 0, table: 3 }]);
});
