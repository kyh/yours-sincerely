import { randomUUID } from "node:crypto";

import { sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  pgView,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const isoNow = () => new Date().toISOString();

export const tokenType = pgEnum("TokenType", ["REFRESH_TOKEN", "VERIFY_EMAIL", "RESET_PASSWORD"]);
export const userRole = pgEnum("UserRole", ["USER", "ADMIN"]);
export const notificationKind = pgEnum("NotificationKind", ["COMMENT"]);
export const pushPlatform = pgEnum("PushPlatform", ["ios", "android"]);

export const user = pgTable(
  "User",
  {
    createdAt: timestamp({ mode: "string", precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    disabled: boolean(),
    displayImage: text(),
    displayName: text(),
    email: text(),
    /** Nothing reads or writes it. It stays until no build inside the rollback window
        declares it: those builds name it in every `User` INSERT, and some in the
        per-request session lookup, so dropping it early turns a rollback into an outage. */
    emailVerified: timestamp({ mode: "string", precision: 3 }),
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => randomUUID()),
    passwordHash: text(),
    role: userRole().default("USER").notNull(),
    // WARNING: a cookie with no epoch reads as 0, this default; changing the default logs out every pre-revocation session.
    sessionEpoch: integer().default(0).notNull(),
    weeklyDigestEmail: boolean().default(false).notNull(),
  },
  (table) => [
    uniqueIndex("User_email_key").using("btree", table.email.asc().nullsLast().op("text_ops")),
    index("User_email_lower_idx").using("btree", sql`lower(${table.email})`),
  ],
);

export const post = pgTable(
  "Post",
  {
    /** A SEEDED OFFSET, not a count of rows. The feed shows
        `baseLikeCount + likeCount`. Conflating the two silently rewrites the
        like count of every seeded post. */
    baseLikeCount: integer(),
    // WARNING: these counters are kept only by the triggers in sql/085-triggers.sql; a new write path to Like, Flag or a child Post must go through them.
    /** Direct child posts. */
    commentCount: integer().default(0).notNull(),
    content: text().notNull(),
    createdAt: timestamp({ mode: "string", precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    createdBy: text(),
    /** Flags that COUNT toward auto-hide — i.e. `Flag."countsTowardHide"` only,
        never a raw count of `Flag` rows. A raw count here would silently undo the
        censorship fix in `sql/010-flagger.sql` and let four cookieless requests
        hide any post again. */
    flagCount: integer().default(0).notNull(),
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => randomUUID()),
    /** Real `Like` rows for this post. NOT including `baseLikeCount`. */
    likeCount: integer().default(0).notNull(),
    parentId: text(),
    updatedAt: timestamp({ mode: "string", precision: 3 })
      .notNull()
      .$defaultFn(isoNow)
      .$onUpdate(isoNow),
    userId: text().notNull(),
  },
  (table) => [
    index("Post_createdAt_idx").using(
      "btree",
      table.createdAt.asc().nullsLast().op("timestamp_ops"),
    ),
    index("Post_feed_idx")
      .using(
        "btree",
        table.createdAt.asc().nullsLast().op("timestamp_ops"),
        table.id.asc().nullsLast().op("text_ops"),
      )
      .where(sql`"parentId" IS NULL`),
    // WARNING: do not drop: production serves ~1.1M ownership lookups index-only from this, not from Post_pkey; never judge it on a fresh database.
    index("Post_id_userId_idx").using(
      "btree",
      table.id.asc().nullsLast().op("text_ops"),
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    index("Post_parentId_idx").using("btree", table.parentId.asc().nullsLast().op("text_ops")),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "Post_parentId_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "Post_userId_fkey",
    }),
    index("Post_userId_createdAt_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
      table.createdAt.asc().nullsLast().op("timestamp_ops"),
    ),
    index("Post_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
  ],
);

export const token = pgTable(
  "Token",
  {
    createdAt: timestamp({ mode: "string", precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    expiresAt: timestamp({ mode: "string", precision: 3 }),
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => randomUUID()),
    sentTo: text(),
    token: text().notNull(),
    type: tokenType().notNull(),
    updatedAt: timestamp({ mode: "string", precision: 3 })
      .notNull()
      .$defaultFn(isoNow)
      .$onUpdate(isoNow),
    usedAt: timestamp({ mode: "string", precision: 3 }),
    userId: text().notNull(),
  },
  (table) => [
    // WARNING: must stay enum_ops: text_ops aborts a push into an empty database and silently skips every later index, User_email_key included.
    uniqueIndex("Token_token_type_key").using(
      "btree",
      table.token.asc().nullsLast().op("text_ops"),
      table.type.asc().nullsLast().op("enum_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "Token_userId_fkey",
    }),
    index("Token_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
  ],
);

export const block = pgTable(
  "Block",
  {
    blockerId: text().notNull(),
    blockingId: text().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.blockerId],
      foreignColumns: [user.id],
      name: "Block_blockerId_fkey",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.blockingId],
      foreignColumns: [user.id],
      name: "Block_blockingId_fkey",
    }).onDelete("restrict"),
    primaryKey({
      columns: [table.blockerId, table.blockingId],
      name: "Block_pkey",
    }),
    index("Block_blockerId_idx").using("btree", table.blockerId.asc().nullsLast().op("text_ops")),
    index("Block_blockingId_idx").using("btree", table.blockingId.asc().nullsLast().op("text_ops")),
  ],
);

export const like = pgTable(
  "Like",
  {
    createdAt: timestamp({ mode: "string", precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    postId: text().notNull(),
    updatedAt: timestamp({ mode: "string", precision: 3 })
      .notNull()
      .$defaultFn(isoNow)
      .$onUpdate(isoNow),
    userId: text().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.postId, table.userId],
      name: "Like_pkey",
    }),
    foreignKey({
      columns: [table.postId],
      foreignColumns: [post.id],
      name: "Like_postId_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "Like_userId_fkey",
    }),
    index("Like_postId_idx").using("btree", table.postId.asc().nullsLast().op("text_ops")),
    index("Like_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
  ],
);

export const flag = pgTable(
  "Flag",
  {
    comment: text(),
    // WARNING: nullable on purpose (NULL = not yet judged) and set only by the setFlagCountsTowardHide trigger, never the app; read sql/080-reconcile.sql first.
    countsTowardHide: boolean(),
    createdAt: timestamp({ mode: "string", precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    postId: text().notNull(),
    resolved: boolean().default(false).notNull(),
    updatedAt: timestamp({ mode: "string", precision: 3 })
      .notNull()
      .$defaultFn(isoNow)
      .$onUpdate(isoNow),
    userId: text().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.postId, table.userId],
      name: "Flag_pkey",
    }),
    foreignKey({
      columns: [table.postId],
      foreignColumns: [post.id],
      name: "Flag_postId_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "Flag_userId_fkey",
    }),
    index("Flag_postId_idx").using("btree", table.postId.asc().nullsLast().op("text_ops")),
    index("Flag_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
  ],
);

/** One row per thing a user should hear about. Today that is only a comment on
    a letter they wrote. Every FK cascades: a deleted comment, letter or account
    takes its notifications with it, so a row can never point at nothing. */
export const notification = pgTable(
  "Notification",
  {
    /** The commenter's display name at the time, so the row survives renames. */
    actorName: text().notNull(),
    /** The comment that caused it. */
    commentId: text().notNull(),
    createdAt: timestamp({ mode: "string", precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => randomUUID()),
    kind: notificationKind().notNull(),
    /** The letter the notification is about. */
    postId: text().notNull(),
    readAt: timestamp({ mode: "string", precision: 3 }),
    /** Recipient. */
    userId: text().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.commentId],
      foreignColumns: [post.id],
      name: "Notification_commentId_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.postId],
      foreignColumns: [post.id],
      name: "Notification_postId_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "Notification_userId_fkey",
    }).onDelete("cascade"),
    uniqueIndex("Notification_userId_commentId_key").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
      table.commentId.asc().nullsLast().op("text_ops"),
    ),
    index("Notification_userId_createdAt_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
      table.createdAt.desc().nullsFirst().op("timestamp_ops"),
    ),
    index("Notification_userId_readAt_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
      table.readAt.asc().nullsLast().op("timestamp_ops"),
    ),
  ],
);

/** Expo push tokens, one row per device. The token is the identity: a device
    that changes hands moves to its new user on the next register call. */
export const pushToken = pgTable(
  "PushToken",
  {
    createdAt: timestamp({ mode: "string", precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    lastSeenAt: timestamp({ mode: "string", precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    platform: pushPlatform().notNull(),
    token: text().primaryKey().notNull(),
    userId: text().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "PushToken_userId_fkey",
    }).onDelete("cascade"),
    index("PushToken_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
  ],
);

/** The row shape of the `Feed` view, for the query builder ONLY.
 *
 *  `.existing()` is load-bearing, not a style choice: it tells drizzle-kit this
 *  view is not its to manage. The DDL lives in `sql/090-views.sql`.
 *
 *  WHY, because this is not obvious and the failure is silent:
 *  **`drizzle-kit push` does not diff a view's body.** It creates a view that is
 *  absent and drops one that is gone from this file, but if the name already
 *  exists it emits nothing, no matter how much the SELECT changed. Verified
 *  against a production-shaped database: push applied all five ADD COLUMNs and
 *  both CREATE INDEXes, dropped the removed `UserStats`, and left a materially
 *  rewritten `Feed` completely untouched — exit 0, no warning.
 *
 *  Had this stayed a `.as(...)` view, `pnpm db:push-remote` would have reported
 *  success while leaving the OLD aggregating `Feed` live: the performance fix
 *  would not have shipped, and neither would the flag-censorship fix, because the
 *  old body counts raw `Flag` rows (`HAVING count(*) > 3`) instead of reading
 *  `Post."flagCount"`. Anyone could still hide any post with four cookieless
 *  requests, with the repo claiming otherwise.
 *
 *  So: if it is a view, `sql/` owns it. Drizzle only describes the columns.
 *
 *  `parentId` is nullable because the view keeps only root posts, so every row in
 *  it has a null parentId; declaring it `.notNull()` was a type-level lie. The
 *  counts are `integer` because they are now plain columns on `Post`, not
 *  `count(*)` aggregates — which is also why they no longer come back as strings. */
export const feed = pgView("Feed", {
  commentCount: integer().notNull(),
  content: text().notNull(),
  createdAt: timestamp({ mode: "string", precision: 3 }).notNull(),
  createdBy: text().notNull(),
  id: text().notNull(),
  likeCount: integer().notNull(),
  parentId: text(),
  userId: text().notNull(),
}).existing();
