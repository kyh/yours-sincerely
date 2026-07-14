import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";

import { eq, inArray } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { flag, like, post, user } from "@repo/db/drizzle-schema";

import { appRouter } from "../root-router";

const integrationTest = process.env.RUN_DB_TESTS === "1" ? test : test.skip;

after(async () => {
  await db.$client.end();
});

const DAY_MS = 24 * 60 * 60 * 1000;

type Flagger = { id: string; kind: "fresh" | "registered" | "aged" };

const callerFor = async (userId: string) => {
  const row = await db.query.user.findFirst({
    where: (candidate, { eq }) => eq(candidate.id, userId),
    columns: { passwordHash: false },
  });
  assert.ok(row);
  return appRouter.createCaller({ headers: new Headers(), user: row, db });
};

/** A post by one author, plus a pool of flaggers of a given kind.
 *
 *  A "fresh" flagger is exactly what a cookieless HTTP request produces today:
 *  `createUserIfNotExists` mints a User row with no email and no posts, created
 *  right now. Seeding the row directly is the same thing without the cookie
 *  plumbing — the establishment rule looks at the User row, not at the transport. */
const createFixture = async (flaggerKinds: Flagger["kind"][]) => {
  const authorId = randomUUID();
  const postId = randomUUID();
  const updatedAt = new Date().toISOString();

  await db.insert(user).values({ id: authorId, displayName: "Author" });
  await db.insert(post).values({
    id: postId,
    content: "A letter someone would rather nobody read",
    createdBy: "Author",
    userId: authorId,
    updatedAt,
  });

  const flaggers: Flagger[] = flaggerKinds.map((kind) => ({ id: randomUUID(), kind }));
  const aged = new Date(Date.now() - 2 * DAY_MS).toISOString();

  await db.insert(user).values(
    flaggers.map((flagger) => ({
      id: flagger.id,
      // Registered: has an email. Aged: 24h+ old (and gets a post below).
      // Fresh: no email, created now, never wrote anything.
      email: flagger.kind === "registered" ? `${flagger.id}@example.com` : null,
      displayName: flagger.kind,
      createdAt: flagger.kind === "aged" ? aged : new Date().toISOString(),
    })),
  );

  const agedFlaggers = flaggers.filter((flagger) => flagger.kind === "aged");
  const agedPostIds = agedFlaggers.map(() => randomUUID());
  if (agedFlaggers.length > 0) {
    await db.insert(post).values(
      agedFlaggers.map((flagger, index) => ({
        id: agedPostIds[index] ?? randomUUID(),
        content: "An established member's own letter",
        createdBy: flagger.kind,
        userId: flagger.id,
        createdAt: aged,
        updatedAt,
      })),
    );
  }

  // A reader with no session at all — the caller the permalink actually serves.
  const reader = appRouter.createCaller({ headers: new Headers(), user: null, db });

  const cleanup = async () => {
    const userIds = [authorId, ...flaggers.map((flagger) => flagger.id)];
    const postIds = [postId, ...agedPostIds];
    await db.delete(like).where(inArray(like.postId, postIds));
    await db.delete(flag).where(inArray(flag.postId, postIds));
    await db.delete(post).where(inArray(post.id, postIds));
    await db.delete(user).where(inArray(user.id, userIds));
  };

  return { authorId, postId, flaggers, reader, cleanup };
};

const flagWith = async (
  fixture: Awaited<ReturnType<typeof createFixture>>,
  reason?: string,
): Promise<void> => {
  for (const flagger of fixture.flaggers) {
    const caller = await callerFor(flagger.id);
    await caller.flag.createFlag({ postId: fixture.postId, reason });
  }
};

const isInFeed = async (fixture: Awaited<ReturnType<typeof createFixture>>): Promise<boolean> => {
  const page = await fixture.reader.post.getFeed({ userId: fixture.authorId, limit: 50 });
  return page.posts.some((row) => row.id === fixture.postId);
};

/** THE REGRESSION. Four cookieless requests used to hide any post in the app. */
integrationTest("a flag storm from fresh anonymous identities does NOT hide a post", async () => {
  const fixture = await createFixture(["fresh", "fresh", "fresh", "fresh"]);
  try {
    await flagWith(fixture);

    // Every flag was recorded — submitting is still allowed for anyone.
    const rows = await db.select().from(flag).where(eq(flag.postId, fixture.postId));
    assert.equal(rows.length, 4);
    // ...but none of them carries moderation authority.
    assert.equal(
      rows.every((row) => row.countsTowardHide === false),
      true,
    );

    assert.equal(await isInFeed(fixture), true);
    const { post: served } = await fixture.reader.post.getPost({ postId: fixture.postId });
    assert.equal(served.id, fixture.postId);
  } finally {
    await fixture.cleanup();
  }
});

/** The safety valve must still work, or abuse was traded for a moderation outage. */
integrationTest("four flags from established identities DO hide a post", async () => {
  const fixture = await createFixture(["registered", "registered", "aged", "aged"]);
  try {
    await flagWith(fixture);

    const rows = await db.select().from(flag).where(eq(flag.postId, fixture.postId));
    assert.equal(rows.length, 4);
    assert.equal(
      rows.every((row) => row.countsTowardHide === true),
      true,
    );

    assert.equal(await isInFeed(fixture), false);
    await assert.rejects(fixture.reader.post.getPost({ postId: fixture.postId }), /Post not found/);
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("the threshold counts only established flags, never the noise", async () => {
  // Three real reports plus a pile of minted identities still sits at 3.
  const fixture = await createFixture([
    "registered",
    "aged",
    "registered",
    "fresh",
    "fresh",
    "fresh",
    "fresh",
    "fresh",
  ]);
  try {
    await flagWith(fixture);

    assert.equal(await isInFeed(fixture), true);
    const { post: served } = await fixture.reader.post.getPost({ postId: fixture.postId });
    assert.equal(served.id, fixture.postId);
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("the feed and the permalink agree on what is hidden", async () => {
  const fixture = await createFixture(["registered", "registered", "registered", "registered"]);
  try {
    await flagWith(fixture);

    // One rule, one column: a post hidden from the feed must 404 at its
    // permalink, and vice versa. These drifted apart once already.
    const inFeed = await isInFeed(fixture);
    const servedAtPermalink = await fixture.reader.post
      .getPost({ postId: fixture.postId })
      .then(() => true)
      .catch(() => false);

    assert.equal(inFeed, false);
    assert.equal(servedAtPermalink, false);
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("a flag's reason is persisted to Flag.comment", async () => {
  const fixture = await createFixture(["registered"]);
  try {
    await flagWith(fixture, "  This is harassment  ");

    const rows = await db.select().from(flag).where(eq(flag.postId, fixture.postId));
    const row = rows[0];
    assert.ok(row);
    assert.equal(row.comment, "This is harassment");
  } finally {
    await fixture.cleanup();
  }
});
