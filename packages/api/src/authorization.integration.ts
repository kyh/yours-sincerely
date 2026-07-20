import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";

import { and, eq, inArray, or } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { flag, like, post, user } from "@repo/db/drizzle-schema";

import { appRouter } from "./root-router";
import { updateUserInput } from "./user/user-schema";

const integrationTest = process.env.RUN_DB_TESTS === "1" ? test : test.skip;

after(async () => {
  await db.$client.end();
});

const createFixture = async () => {
  const actorId = randomUUID();
  const victimId = randomUUID();
  const parentId = randomUUID();
  const childId = randomUUID();
  const outsiderPostId = randomUUID();
  const postIds = [parentId, childId, outsiderPostId];
  const updatedAt = new Date().toISOString();

  await db.insert(user).values([
    { id: actorId, displayName: "Actor" },
    { id: victimId, displayName: "Victim" },
  ]);
  await db.insert(post).values([
    {
      id: parentId,
      content: "Actor-owned parent post",
      createdBy: "Actor",
      userId: actorId,
      updatedAt,
    },
    {
      id: childId,
      content: "Victim-authored child post",
      createdBy: "Victim",
      parentId,
      userId: victimId,
      updatedAt,
    },
    {
      id: outsiderPostId,
      content: "Victim-owned independent post",
      createdBy: "Victim",
      userId: victimId,
      updatedAt,
    },
  ]);

  const actor = await db.query.user.findFirst({
    where: (row, operators) => operators.eq(row.id, actorId),
    columns: { passwordHash: false },
  });
  assert.ok(actor);

  const caller = appRouter.createCaller({ headers: new Headers(), user: actor, db });

  const cleanup = async () => {
    await db
      .delete(like)
      .where(or(inArray(like.postId, postIds), inArray(like.userId, [actorId, victimId])));
    await db
      .delete(flag)
      .where(or(inArray(flag.postId, postIds), inArray(flag.userId, [actorId, victimId])));
    await db.delete(post).where(inArray(post.id, [childId, parentId, outsiderPostId]));
    await db.delete(user).where(inArray(user.id, [actorId, victimId]));
  };

  return { actorId, victimId, parentId, childId, outsiderPostId, caller, cleanup, updatedAt };
};

integrationTest("profile updates derive the actor from the authenticated context", async () => {
  const fixture = await createFixture();
  try {
    // A hostile payload naming someone else, parsed the way a real request is:
    // the retired `userId` field is stripped at the boundary, so the router only
    // ever sees the display name and writes it to the authenticated actor.
    await fixture.caller.user.updateUser(
      updateUserInput.parse({
        userId: fixture.victimId,
        displayName: "Updated actor",
      }),
    );

    const rows = await db
      .select({ id: user.id, displayName: user.displayName })
      .from(user)
      .where(inArray(user.id, [fixture.actorId, fixture.victimId]));
    const names = new Map(rows.map((row) => [row.id, row.displayName]));
    assert.equal(names.get(fixture.actorId), "Updated actor");
    assert.equal(names.get(fixture.victimId), "Victim");
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("post deletion rejects a different owner", async () => {
  const fixture = await createFixture();
  try {
    await assert.rejects(
      fixture.caller.post.deletePost({ postId: fixture.outsiderPostId }),
      /Post not found/,
    );
    const remaining = await db
      .select({ id: post.id })
      .from(post)
      .where(eq(post.id, fixture.outsiderPostId));
    assert.equal(remaining.length, 1);
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("owner deletion cascades through descendants, likes, and flags", async () => {
  const fixture = await createFixture();
  try {
    await db.insert(like).values([
      { postId: fixture.parentId, userId: fixture.victimId, updatedAt: fixture.updatedAt },
      { postId: fixture.childId, userId: fixture.actorId, updatedAt: fixture.updatedAt },
    ]);
    await db.insert(flag).values([
      { postId: fixture.parentId, userId: fixture.actorId, updatedAt: fixture.updatedAt },
      { postId: fixture.childId, userId: fixture.victimId, updatedAt: fixture.updatedAt },
    ]);

    await fixture.caller.post.deletePost({ postId: fixture.parentId });

    const deletedIds = [fixture.parentId, fixture.childId];
    const [posts, likes, flags] = await Promise.all([
      db.select({ id: post.id }).from(post).where(inArray(post.id, deletedIds)),
      db.select().from(like).where(inArray(like.postId, deletedIds)),
      db.select().from(flag).where(inArray(flag.postId, deletedIds)),
    ]);
    assert.equal(posts.length, 0);
    assert.equal(likes.length, 0);
    assert.equal(flags.length, 0);

    const outsider = await db
      .select({ id: post.id })
      .from(post)
      .where(and(eq(post.id, fixture.outsiderPostId), eq(post.userId, fixture.victimId)));
    assert.equal(outsider.length, 1);
  } finally {
    await fixture.cleanup();
  }
});
