import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";

import { eq, inArray } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { flag, like, post, user } from "@repo/db/drizzle-schema";

import { callerFor, createCaller } from "../test-utils";

const integrationTest = process.env.RUN_DB_TESTS === "1" ? test : test.skip;

after(async () => {
  await db.$client.end();
});

const DAY_MS = 24 * 60 * 60 * 1000;

interface Flagger {
  id: string;
  kind: "fresh" | "registered" | "aged";
}

const createFixture = async (flaggerKinds: Flagger["kind"][]) => {
  const authorId = randomUUID();
  const postId = randomUUID();
  const updatedAt = new Date().toISOString();

  await db.insert(user).values({ displayName: "Author", id: authorId });
  await db.insert(post).values({
    content: "A letter someone would rather nobody read",
    createdBy: "Author",
    id: postId,
    updatedAt,
    userId: authorId,
  });

  const flaggers: Flagger[] = flaggerKinds.map((kind) => ({ id: randomUUID(), kind }));
  const aged = new Date(Date.now() - 2 * DAY_MS).toISOString();

  await db.insert(user).values(
    flaggers.map((flagger) => ({
      createdAt: flagger.kind === "aged" ? aged : new Date().toISOString(),
      displayName: flagger.kind,
      email: flagger.kind === "registered" ? `${flagger.id}@example.com` : null,
      id: flagger.id,
    })),
  );

  const agedFlaggers = flaggers.filter((flagger) => flagger.kind === "aged");
  const agedPostIds = agedFlaggers.map(() => randomUUID());

  if (agedFlaggers.length > 0) {
    await db.insert(post).values(
      agedFlaggers.map((flagger, index) => ({
        content: "An established member's own letter",
        createdAt: aged,
        createdBy: flagger.kind,
        id: agedPostIds[index] ?? randomUUID(),
        updatedAt,
        userId: flagger.id,
      })),
    );
  }

  const reader = createCaller(null);

  const cleanup = async () => {
    const userIds = [authorId, ...flaggers.map((flagger) => flagger.id)];
    const postIds = [postId, ...agedPostIds];
    await db.delete(like).where(inArray(like.postId, postIds));
    await db.delete(flag).where(inArray(flag.postId, postIds));
    await db.delete(post).where(inArray(post.id, postIds));
    await db.delete(user).where(inArray(user.id, userIds));
  };

  return { authorId, cleanup, flaggers, postId, reader };
};

const flagWith = async (fixture: Awaited<ReturnType<typeof createFixture>>, reason?: string) => {
  for (const flagger of fixture.flaggers) {
    const caller = await callerFor(flagger.id);
    await caller.flag.createFlag({ postId: fixture.postId, reason });
  }
};

const isInFeed = async (fixture: Awaited<ReturnType<typeof createFixture>>) => {
  const page = await fixture.reader.post.getFeed({ limit: 50, userId: fixture.authorId });

  return page.posts.some((row) => row.id === fixture.postId);
};

integrationTest("a flag storm from fresh anonymous identities does NOT hide a post", async () => {
  const fixture = await createFixture(["fresh", "fresh", "fresh", "fresh"]);

  try {
    await flagWith(fixture);

    const rows = await db.select().from(flag).where(eq(flag.postId, fixture.postId));
    assert.equal(rows.length, 4);
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
    await assert.rejects(
      fixture.reader.post.getPost({ postId: fixture.postId }),
      /Post not found/u,
    );
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("the threshold counts only established flags, never the noise", async () => {
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
    const [row] = rows;
    assert.ok(row);
    assert.equal(row.comment, "This is harassment");
  } finally {
    await fixture.cleanup();
  }
});
