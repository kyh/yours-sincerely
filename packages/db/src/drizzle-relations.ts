import { defineRelations } from "drizzle-orm";

import * as schema from "./drizzle-schema";

/** The one relation graph, keyed by the schema's export names. `drizzle-client.ts`
    hands it to `drizzle()`, which is what makes `db.query.<table>` exist.

    Where two relations point at the same table — a block's blocker and blocking
    user, a notification's comment and letter, a post's parent and children — the
    `alias` pairs each `one` with its reverse `many`, and the `many` also spells
    its `from`/`to` so nothing is left to inference. */
export const relations = defineRelations(schema, (r) => ({
  account: {
    user: r.one.user({ from: r.account.userId, to: r.user.id }),
  },
  block: {
    /** `optional: false` on both: the FKs are NOT NULL and `ON DELETE RESTRICT`,
        so the user row always exists, and `listBlocks` reads it without a guard
        — exactly the type the non-null FK gave these relations before 1.0. */
    user_blockerId: r.one.user({
      alias: "block_blockerId_user_id",
      from: r.block.blockerId,
      optional: false,
      to: r.user.id,
    }),
    user_blockingId: r.one.user({
      alias: "block_blockingId_user_id",
      from: r.block.blockingId,
      optional: false,
      to: r.user.id,
    }),
  },
  enrolledEvent: {
    user: r.one.user({ from: r.enrolledEvent.userId, to: r.user.id }),
  },
  flag: {
    post: r.one.post({ from: r.flag.postId, to: r.post.id }),
    user: r.one.user({ from: r.flag.userId, to: r.user.id }),
  },
  like: {
    post: r.one.post({ from: r.like.postId, to: r.post.id }),
    user: r.one.user({ from: r.like.userId, to: r.user.id }),
  },
  notification: {
    comment: r.one.post({
      alias: "notification_comment",
      from: r.notification.commentId,
      to: r.post.id,
    }),
    post: r.one.post({
      alias: "notification_post",
      from: r.notification.postId,
      to: r.post.id,
    }),
    user: r.one.user({ from: r.notification.userId, to: r.user.id }),
  },
  post: {
    flags: r.many.flag(),
    likes: r.many.like(),
    /** The parent letter of a comment. */
    post: r.one.post({
      alias: "post_parentId_post_id",
      from: r.post.parentId,
      to: r.post.id,
    }),
    /** Direct comments. */
    posts: r.many.post({
      alias: "post_parentId_post_id",
      from: r.post.id,
      to: r.post.parentId,
    }),
    user: r.one.user({ from: r.post.userId, to: r.user.id }),
  },
  pushToken: {
    user: r.one.user({ from: r.pushToken.userId, to: r.user.id }),
  },
  token: {
    user: r.one.user({ from: r.token.userId, to: r.user.id }),
  },
  user: {
    accounts: r.many.account(),
    blocks_blockerId: r.many.block({
      alias: "block_blockerId_user_id",
      from: r.user.id,
      to: r.block.blockerId,
    }),
    blocks_blockingId: r.many.block({
      alias: "block_blockingId_user_id",
      from: r.user.id,
      to: r.block.blockingId,
    }),
    enrolledEvents: r.many.enrolledEvent(),
    flags: r.many.flag(),
    likes: r.many.like(),
    notifications: r.many.notification(),
    posts: r.many.post(),
    pushTokens: r.many.pushToken(),
    tokens: r.many.token(),
  },
}));
