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

export const tokenType = pgEnum("TokenType", ["REFRESH_TOKEN", "VERIFY_EMAIL", "RESET_PASSWORD"]);
export const userRole = pgEnum("UserRole", ["USER", "ADMIN"]);
export const notificationKind = pgEnum("NotificationKind", ["COMMENT"]);
export const pushPlatform = pgEnum("PushPlatform", ["ios", "android"]);

export const prompt = pgTable("Prompt", {
  content: text().notNull(),
  id: text().primaryKey().notNull(),
});

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
    emailVerified: timestamp({ mode: "string", precision: 3 }),
    id: text().primaryKey().notNull(),
    passwordHash: text(),
    role: userRole().default("USER").notNull(),
    // Revocation, NOT expiry. Bumping this invalidates every session cookie
    // already issued for this user (password reset, "sign out everywhere").
    // Cookies minted before this column existed carry no `epoch` and are read as
    // 0, which matches the default — so no existing session is logged out.
    sessionEpoch: integer().default(0).notNull(),
    weeklyDigestEmail: boolean().default(false).notNull(),
  },
  (table) => [
    uniqueIndex("User_email_key").using("btree", table.email.asc().nullsLast().op("text_ops")),
  ],
);

export const account = pgTable(
  "Account",
  {
    accessToken: text(),
    expiresAt: integer(),
    id: text().primaryKey().notNull(),
    provider: text().notNull(),
    providerAccountId: text().notNull(),
    refreshToken: text(),
    userId: text().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "Account_userId_fkey",
    }),
    uniqueIndex("Account_provider_providerAccountId_key").using(
      "btree",
      table.provider.asc().nullsLast().op("text_ops"),
      table.providerAccountId.asc().nullsLast().op("text_ops"),
    ),
    index("Account_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
  ],
);

export const enrolledEvent = pgTable(
  "EnrolledEvent",
  {
    end: timestamp({ mode: "string", precision: 3 }).notNull(),
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    slug: text().notNull(),
    start: timestamp({ mode: "string", precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    userId: text().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "EnrolledEvent_userId_fkey",
    }),
    index("EnrolledEvent_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
  ],
);

export const post = pgTable(
  "Post",
  {
    /** A SEEDED OFFSET, not a count of rows. The feed shows
        `baseLikeCount + likeCount`. Conflating the two silently rewrites the
        like count of every seeded post. */
    baseLikeCount: integer(),
    // `commentCount`, `flagCount` and `likeCount` are denormalized counters,
    // maintained by the triggers in `sql/085-triggers.sql`. They exist because
    // the Feed view used to re-aggregate all of "Like", all of "Post" and all of
    // "Flag" on EVERY page of EVERY feed request.
    //
    // Any new write path touching Like / Flag / child-Post must go through those
    // triggers, or these numbers drift. Drift is the failure mode of
    // denormalization and nobody notices it for weeks — so `sql/080-reconcile.sql`
    // recomputes all three from ground truth on every push. Repairing drift is
    // `pnpm db:push`; there is no separate script to remember.
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
    id: text().primaryKey().notNull(),
    /** Real `Like` rows for this post. NOT including `baseLikeCount`. */
    likeCount: integer().default(0).notNull(),
    parentId: text(),
    updatedAt: timestamp({ mode: "string", precision: 3 }).notNull(),
    userId: text().notNull(),
  },
  (table) => [
    index("Post_createdAt_idx").using(
      "btree",
      table.createdAt.asc().nullsLast().op("timestamp_ops"),
    ),
    /** Supports the feed's keyset seek. Ascending, because the feed's
          `ORDER BY createdAt DESC, id DESC` reverses BOTH columns uniformly, and
          Postgres serves that with a backward scan of this index. Partial,
          because the feed never looks at comments. */
    index("Post_feed_idx")
      .using(
        "btree",
        table.createdAt.asc().nullsLast().op("timestamp_ops"),
        table.id.asc().nullsLast().op("text_ops"),
      )
      .where(sql`"parentId" IS NULL`),
    /** DO NOT DROP. This looks like textbook dead weight — it is led by `id`,
          the primary key, so it can never be more selective than `Post_pkey` — and
          that reasoning has already been raised once as "pure write overhead".
          It is wrong, and the argument is seductive enough to be worth writing down.

          Production says the opposite: 1,119,988 scans against `Post_pkey`'s 0
          (`pg_stat_user_indexes`, lifetime — `stats_reset` is null). It is not
          competing with the primary key, it is REPLACING it: `(id, userId)` covers
          "given a post id, whose is it?", which the authorization checks ask
          constantly, so the planner serves them index-only and never touches the
          heap. Dropping it moves ~1.1M lookups onto heap fetches.

          Never judge this one locally: on a fresh database every index reports
          `idx_scan = 0`, which proves nothing at all. Only `pg_stat_user_indexes`
          on production can answer it, and it already has. */
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
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "Post_userId_fkey",
    }),
    /** Supports getPostsByUser and the parameterized getUserStats. */
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
    id: text().primaryKey().notNull(),
    sentTo: text(),
    token: text().notNull(),
    type: tokenType().notNull(),
    updatedAt: timestamp({ mode: "string", precision: 3 }).notNull(),
    usedAt: timestamp({ mode: "string", precision: 3 }),
    userId: text().notNull(),
  },
  (table) => [
    /** `type` is the `TokenType` enum, so its btree opclass is `enum_ops`.
          drizzle-kit's introspection wrote `text_ops` here for every column
          regardless of type, and Postgres rejects that for an enum:
          `operator class "text_ops" does not accept data type "TokenType"` (42804).

          It looked harmless because push never hit it against a database that
          already had this index — i.e. production, or anything built from the old
          migrations. It only fired on push into an EMPTY database, where it
          aborted the run and silently skipped every index after it, including the
          UNIQUE `User_email_key`. A schema that permits duplicate emails, from a
          push that reported success. */
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
    updatedAt: timestamp({ mode: "string", precision: 3 }).notNull(),
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
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "Like_userId_fkey",
    }),
    index("Like_postId_idx").using("btree", table.postId.asc().nullsLast().op("text_ops")),
    index("Like_postId_userId_idx").using(
      "btree",
      table.postId.asc().nullsLast().op("text_ops"),
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    index("Like_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
  ],
);

export const flag = pgTable(
  "Flag",
  {
    comment: text(),
    // Whether this flag carries moderation AUTHORITY, i.e. counts toward the
    // auto-hide threshold. Anyone may submit a flag — a brand-new cookieless
    // identity costs one request, so counting every flag let four requests hide
    // any post in the app. The value is decided ONCE, at insert time, by the
    // `isEstablishedFlagger` SQL function (the single definition of the rule)
    // via the `setFlagCountsTowardHide` trigger. Never write it from the app.
    //
    // Frozen at insert time on purpose: "established" depends on wall-clock age,
    // so a live rule could not be denormalized onto Post.flagCount without a
    // cron re-evaluating every flag. Freezing errs strictly toward counting
    // FEWER flags, which is the safe direction for a censorship primitive.
    //
    // NULLABLE, and deliberately so — the three states are distinct:
    //
    //     NULL  = not yet judged
    //     true  = judged, carries authority, frozen
    //     false = judged, no authority, frozen
    //
    // `NOT NULL DEFAULT false` would collapse "not yet judged" into "judged, no
    // authority", and the backfill in `sql/080-reconcile.sql` could then never
    // tell which rows it had already decided. Since that file re-runs on every
    // push, it would re-judge every flag against a wall-clock rule and could flip
    // a frozen false to true — hiding a post because someone deployed. The NULL
    // is what keeps the freeze honest. Read the note in that file before touching.
    countsTowardHide: boolean(),
    createdAt: timestamp({ mode: "string", precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    postId: text().notNull(),
    resolved: boolean().default(false).notNull(),
    updatedAt: timestamp({ mode: "string", precision: 3 }).notNull(),
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
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "Flag_userId_fkey",
    }),
    index("Flag_postId_idx").using("btree", table.postId.asc().nullsLast().op("text_ops")),
    index("Flag_postId_userId_idx").using(
      "btree",
      table.postId.asc().nullsLast().op("text_ops"),
      table.userId.asc().nullsLast().op("text_ops"),
    ),
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
    id: text().primaryKey().notNull(),
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
    // One notification per (recipient, comment): the backfill and any retry
    // of the write path are idempotent because of this, not by convention.
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

// NOTE: the `UserStats` VIEW is gone. It computed streaks for EVERY user with a
// window function over every post in the table, and only then filtered to the one
// caller asked for — and it is fired on profile-link HOVER. It is now the
// `public."getUserStats"(text)` FUNCTION in `sql/040-user-stats.sql`, which pushes
// the userId into the CTEs so the work is proportional to one user's posts. The
// streak logic is a verbatim port; `packages/api/src/user/user-router.ts` calls it.
//
// Its absence from this file is what makes push drop it — unlike `Feed` above,
// which push would have silently left alone. Removing a view here works; changing
// one does not.
