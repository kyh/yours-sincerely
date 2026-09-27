import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";

import { getExpiryProgress, POST_EXPIRY_DAYS } from "@repo/contracts/content";
import { inArray } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { post, user } from "@repo/db/drizzle-schema";

import { createCaller } from "../test-utils";

const integrationTest = process.env.RUN_DB_TESTS === "1" ? test : test.skip;

after(async () => {
  await db.$client.end();
});

const HOUR_MS = 60 * 60 * 1000;
const EXPIRY_MS = POST_EXPIRY_DAYS * 24 * HOUR_MS;

/** The Feed view's cutoff is a SQL literal (`sql/090-views.sql`) and the timer is
    `POST_EXPIRY_DAYS`. Nothing else ties them together, and a cutoff rounded to a
    day boundary serves letters the timer already shows as "Expired". */
integrationTest("the feed drops a letter exactly when its timer expires", async () => {
  const authorId = randomUUID();
  const now = Date.now();
  const updatedAt = new Date(now).toISOString();
  const letter = (ageMs: number) => ({
    content: "A letter near the end of its ink",
    createdAt: new Date(now - ageMs).toISOString(),
    createdBy: "Expiry author",
    id: randomUUID(),
    updatedAt,
    userId: authorId,
  });
  const fading = letter(EXPIRY_MS - HOUR_MS);
  const expired = letter(EXPIRY_MS + HOUR_MS);

  await db.insert(user).values({ displayName: "Expiry author", id: authorId });
  await db.insert(post).values([fading, expired]);
  try {
    assert.equal(getExpiryProgress(fading.createdAt).isExpired, false);
    assert.equal(getExpiryProgress(expired.createdAt).isExpired, true);

    const page = await createCaller(null).post.getFeed({ limit: 50, userId: authorId });

    assert.deepEqual(
      page.posts.map((row) => row.id),
      [fading.id],
    );
  } finally {
    await db.delete(post).where(inArray(post.id, [fading.id, expired.id]));
    await db.delete(user).where(inArray(user.id, [authorId]));
  }
});
