import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";

import { inArray } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { flag, like, post, user } from "@repo/db/drizzle-schema";

import { appRouter } from "../root-router";
import { POST_HISTORY_WINDOW_DAYS } from "./post-utils";

const integrationTest = process.env.RUN_DB_TESTS === "1" ? test : test.skip;

after(async () => {
  await db.$client.end();
});

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY_MS).toISOString();

const createFixture = async () => {
  const authorId = randomUUID();
  const updatedAt = new Date().toISOString();

  const recentId = randomUUID();
  const expiredId = randomUUID();
  const ancientId = randomUUID();
  const postIds = [recentId, expiredId, ancientId];

  await db.insert(user).values({ id: authorId, displayName: "Historian" });
  await db.insert(post).values([
    {
      id: recentId,
      content: "A letter written this week",
      createdBy: "Historian",
      userId: authorId,
      createdAt: daysAgo(1),
      updatedAt,
    },
    {
      id: expiredId,
      content: "A letter past the 21-day window",
      createdBy: "Historian",
      userId: authorId,
      createdAt: daysAgo(30),
      updatedAt,
    },
    {
      id: ancientId,
      content: "A letter older than the profile history window",
      createdBy: "Historian",
      userId: authorId,
      createdAt: daysAgo(POST_HISTORY_WINDOW_DAYS + 10),
      updatedAt,
    },
  ]);

  // An unauthenticated caller — this is exactly the caller the endpoint exposes.
  const caller = appRouter.createCaller({ headers: new Headers(), user: null, db });

  const cleanup = async () => {
    await db.delete(like).where(inArray(like.postId, postIds));
    await db.delete(flag).where(inArray(flag.postId, postIds));
    await db.delete(post).where(inArray(post.id, postIds));
    await db.delete(user).where(inArray(user.id, [authorId]));
  };

  return { authorId, recentId, expiredId, ancientId, caller, cleanup };
};

integrationTest("getPostsByUser hands out dates, never post ids", async () => {
  const fixture = await createFixture();
  try {
    const { posts } = await fixture.caller.post.getPostsByUser({ userId: fixture.authorId });

    assert.ok(posts.length > 0);
    for (const row of posts) {
      assert.deepEqual(Object.keys(row), ["createdAt"]);
      assert.equal("id" in row, false);
    }
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("getPostsByUser is bounded by the profile history window", async () => {
  const fixture = await createFixture();
  try {
    const { posts } = await fixture.caller.post.getPostsByUser({ userId: fixture.authorId });

    // The recent and the expired-but-in-window letters both count toward the
    // heatmap; the one beyond the window does not (it is not an unbounded scan).
    assert.equal(posts.length, 2);
    const floor = new Date(Date.now() - POST_HISTORY_WINDOW_DAYS * DAY_MS);
    for (const row of posts) {
      assert.ok(new Date(`${row.createdAt}Z`) >= floor);
    }
  } finally {
    await fixture.cleanup();
  }
});

/** PRODUCT DECISION, deliberately locked in: an expired letter STAYS READABLE at
    its permalink, forever. The feed drops it after 21 days; the share link does
    not die. If someone later "fixes" `getPost` to 404 expired posts, this test
    fails on purpose — that is a product change, not a bug fix. */
integrationTest("getPost still serves a letter past the 21-day feed window", async () => {
  const fixture = await createFixture();
  try {
    const { post: expired } = await fixture.caller.post.getPost({ postId: fixture.expiredId });

    assert.equal(expired.id, fixture.expiredId);
    assert.equal(expired.content, "A letter past the 21-day window");
  } finally {
    await fixture.cleanup();
  }
});
