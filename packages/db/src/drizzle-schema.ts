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
import { relations } from "drizzle-orm/relations";

export const tokenType = pgEnum("TokenType", ["REFRESH_TOKEN", "VERIFY_EMAIL", "RESET_PASSWORD"]);
export const userRole = pgEnum("UserRole", ["USER", "ADMIN"]);

export const prompt = pgTable("Prompt", {
  id: text().primaryKey().notNull(),
  content: text().notNull(),
});

export const user = pgTable(
  "User",
  {
    id: text().primaryKey().notNull(),
    email: text(),
    emailVerified: timestamp({ precision: 3, mode: "string" }),
    passwordHash: text(),
    displayName: text(),
    displayImage: text(),
    disabled: boolean(),
    weeklyDigestEmail: boolean().default(false).notNull(),
    role: userRole().default("USER").notNull(),
    // Revocation, NOT expiry. Bumping this invalidates every session cookie
    // already issued for this user (password reset, "sign out everywhere").
    // Cookies minted before this column existed carry no `epoch` and are read as
    // 0, which matches the default — so no existing session is logged out.
    sessionEpoch: integer().default(0).notNull(),
    createdAt: timestamp({ precision: 3, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => {
    return {
      emailKey: uniqueIndex("User_email_key").using(
        "btree",
        table.email.asc().nullsLast().op("text_ops"),
      ),
    };
  },
);

export const account = pgTable(
  "Account",
  {
    id: text().primaryKey().notNull(),
    provider: text().notNull(),
    providerAccountId: text().notNull(),
    refreshToken: text(),
    accessToken: text(),
    expiresAt: integer(),
    userId: text().notNull(),
  },
  (table) => {
    return {
      providerProviderAccountIdKey: uniqueIndex("Account_provider_providerAccountId_key").using(
        "btree",
        table.provider.asc().nullsLast().op("text_ops"),
        table.providerAccountId.asc().nullsLast().op("text_ops"),
      ),
      userIdIdx: index("Account_userId_idx").using(
        "btree",
        table.userId.asc().nullsLast().op("text_ops"),
      ),
      accountUserIdFkey: foreignKey({
        columns: [table.userId],
        foreignColumns: [user.id],
        name: "Account_userId_fkey",
      }),
    };
  },
);

export const enrolledEvent = pgTable(
  "EnrolledEvent",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    slug: text().notNull(),
    start: timestamp({ precision: 3, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    end: timestamp({ precision: 3, mode: "string" }).notNull(),
    userId: text().notNull(),
  },
  (table) => {
    return {
      userIdIdx: index("EnrolledEvent_userId_idx").using(
        "btree",
        table.userId.asc().nullsLast().op("text_ops"),
      ),
      enrolledEventUserIdFkey: foreignKey({
        columns: [table.userId],
        foreignColumns: [user.id],
        name: "EnrolledEvent_userId_fkey",
      }),
    };
  },
);

export const post = pgTable(
  "Post",
  {
    id: text().primaryKey().notNull(),
    content: text().notNull(),
    createdBy: text(),
    /** A SEEDED OFFSET, not a count of rows. The feed shows
        `baseLikeCount + likeCount`. Conflating the two silently rewrites the
        like count of every seeded post. */
    baseLikeCount: integer(),
    // Denormalized counters, maintained by the triggers in `sql/085-triggers.sql`.
    // They exist because the Feed view used to re-aggregate all of "Like", all of
    // "Post" and all of "Flag" on EVERY page of EVERY feed request.
    //
    // Any new write path touching Like / Flag / child-Post must go through those
    // triggers, or these numbers drift. Drift is the failure mode of
    // denormalization and nobody notices it for weeks — so `sql/080-reconcile.sql`
    // recomputes all three from ground truth on every push. Repairing drift is
    // `pnpm db:push`; there is no separate script to remember.
    /** Real `Like` rows for this post. NOT including `baseLikeCount`. */
    likeCount: integer().default(0).notNull(),
    /** Direct child posts. */
    commentCount: integer().default(0).notNull(),
    /** Flags that COUNT toward auto-hide — i.e. `Flag."countsTowardHide"` only,
        never a raw count of `Flag` rows. A raw count here would silently undo the
        censorship fix in `sql/010-flagger.sql` and let four cookieless requests
        hide any post again. */
    flagCount: integer().default(0).notNull(),
    parentId: text(),
    userId: text().notNull(),
    createdAt: timestamp({ precision: 3, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: "string" }).notNull(),
  },
  (table) => {
    return {
      createdAtIdx: index("Post_createdAt_idx").using(
        "btree",
        table.createdAt.asc().nullsLast().op("timestamp_ops"),
      ),
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
      idUserIdIdx: index("Post_id_userId_idx").using(
        "btree",
        table.id.asc().nullsLast().op("text_ops"),
        table.userId.asc().nullsLast().op("text_ops"),
      ),
      parentIdIdx: index("Post_parentId_idx").using(
        "btree",
        table.parentId.asc().nullsLast().op("text_ops"),
      ),
      userIdIdx: index("Post_userId_idx").using(
        "btree",
        table.userId.asc().nullsLast().op("text_ops"),
      ),
      /** Supports the feed's keyset seek. Ascending, because the feed's
          `ORDER BY createdAt DESC, id DESC` reverses BOTH columns uniformly, and
          Postgres serves that with a backward scan of this index. Partial,
          because the feed never looks at comments. */
      feedIdx: index("Post_feed_idx")
        .using(
          "btree",
          table.createdAt.asc().nullsLast().op("timestamp_ops"),
          table.id.asc().nullsLast().op("text_ops"),
        )
        .where(sql`"parentId" IS NULL`),
      /** Supports getPostsByUser and the parameterized getUserStats. */
      userIdCreatedAtIdx: index("Post_userId_createdAt_idx").using(
        "btree",
        table.userId.asc().nullsLast().op("text_ops"),
        table.createdAt.asc().nullsLast().op("timestamp_ops"),
      ),
      postParentIdFkey: foreignKey({
        columns: [table.parentId],
        foreignColumns: [table.id],
        name: "Post_parentId_fkey",
      }),
      postUserIdFkey: foreignKey({
        columns: [table.userId],
        foreignColumns: [user.id],
        name: "Post_userId_fkey",
      }),
    };
  },
);

export const token = pgTable(
  "Token",
  {
    id: text().primaryKey().notNull(),
    token: text().notNull(),
    type: tokenType().notNull(),
    expiresAt: timestamp({ precision: 3, mode: "string" }),
    sentTo: text(),
    usedAt: timestamp({ precision: 3, mode: "string" }),
    userId: text().notNull(),
    createdAt: timestamp({ precision: 3, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: "string" }).notNull(),
  },
  (table) => {
    return {
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
      tokenTypeKey: uniqueIndex("Token_token_type_key").using(
        "btree",
        table.token.asc().nullsLast().op("text_ops"),
        table.type.asc().nullsLast().op("enum_ops"),
      ),
      userIdIdx: index("Token_userId_idx").using(
        "btree",
        table.userId.asc().nullsLast().op("text_ops"),
      ),
      tokenUserIdFkey: foreignKey({
        columns: [table.userId],
        foreignColumns: [user.id],
        name: "Token_userId_fkey",
      }),
    };
  },
);

export const block = pgTable(
  "Block",
  {
    blockerId: text().notNull(),
    blockingId: text().notNull(),
  },
  (table) => {
    return {
      blockerIdIdx: index("Block_blockerId_idx").using(
        "btree",
        table.blockerId.asc().nullsLast().op("text_ops"),
      ),
      blockingIdIdx: index("Block_blockingId_idx").using(
        "btree",
        table.blockingId.asc().nullsLast().op("text_ops"),
      ),
      blockBlockerIdFkey: foreignKey({
        columns: [table.blockerId],
        foreignColumns: [user.id],
        name: "Block_blockerId_fkey",
      }).onDelete("restrict"),
      blockBlockingIdFkey: foreignKey({
        columns: [table.blockingId],
        foreignColumns: [user.id],
        name: "Block_blockingId_fkey",
      }).onDelete("restrict"),
      blockPkey: primaryKey({
        columns: [table.blockerId, table.blockingId],
        name: "Block_pkey",
      }),
    };
  },
);

export const like = pgTable(
  "Like",
  {
    postId: text().notNull(),
    userId: text().notNull(),
    createdAt: timestamp({ precision: 3, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: "string" }).notNull(),
  },
  (table) => {
    return {
      postIdIdx: index("Like_postId_idx").using(
        "btree",
        table.postId.asc().nullsLast().op("text_ops"),
      ),
      postIdUserIdIdx: index("Like_postId_userId_idx").using(
        "btree",
        table.postId.asc().nullsLast().op("text_ops"),
        table.userId.asc().nullsLast().op("text_ops"),
      ),
      userIdIdx: index("Like_userId_idx").using(
        "btree",
        table.userId.asc().nullsLast().op("text_ops"),
      ),
      likePostIdFkey: foreignKey({
        columns: [table.postId],
        foreignColumns: [post.id],
        name: "Like_postId_fkey",
      }),
      likeUserIdFkey: foreignKey({
        columns: [table.userId],
        foreignColumns: [user.id],
        name: "Like_userId_fkey",
      }),
      likePkey: primaryKey({
        columns: [table.postId, table.userId],
        name: "Like_pkey",
      }),
    };
  },
);

export const flag = pgTable(
  "Flag",
  {
    comment: text(),
    resolved: boolean().default(false).notNull(),
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
    postId: text().notNull(),
    userId: text().notNull(),
    createdAt: timestamp({ precision: 3, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: "string" }).notNull(),
  },
  (table) => {
    return {
      postIdIdx: index("Flag_postId_idx").using(
        "btree",
        table.postId.asc().nullsLast().op("text_ops"),
      ),
      postIdUserIdIdx: index("Flag_postId_userId_idx").using(
        "btree",
        table.postId.asc().nullsLast().op("text_ops"),
        table.userId.asc().nullsLast().op("text_ops"),
      ),
      userIdIdx: index("Flag_userId_idx").using(
        "btree",
        table.userId.asc().nullsLast().op("text_ops"),
      ),
      flagPostIdFkey: foreignKey({
        columns: [table.postId],
        foreignColumns: [post.id],
        name: "Flag_postId_fkey",
      }),
      flagUserIdFkey: foreignKey({
        columns: [table.userId],
        foreignColumns: [user.id],
        name: "Flag_userId_fkey",
      }),
      flagPkey: primaryKey({
        columns: [table.postId, table.userId],
        name: "Flag_pkey",
      }),
    };
  },
);

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  enrolledEvents: many(enrolledEvent),
  posts: many(post),
  tokens: many(token),
  blocks_blockerId: many(block, {
    relationName: "block_blockerId_user_id",
  }),
  blocks_blockingId: many(block, {
    relationName: "block_blockingId_user_id",
  }),
  likes: many(like),
  flags: many(flag),
}));

export const enrolledEventRelations = relations(enrolledEvent, ({ one }) => ({
  user: one(user, {
    fields: [enrolledEvent.userId],
    references: [user.id],
  }),
}));

export const postRelations = relations(post, ({ one, many }) => ({
  post: one(post, {
    fields: [post.parentId],
    references: [post.id],
    relationName: "post_parentId_post_id",
  }),
  posts: many(post, {
    relationName: "post_parentId_post_id",
  }),
  user: one(user, {
    fields: [post.userId],
    references: [user.id],
  }),
  likes: many(like),
  flags: many(flag),
}));

export const tokenRelations = relations(token, ({ one }) => ({
  user: one(user, {
    fields: [token.userId],
    references: [user.id],
  }),
}));

export const blockRelations = relations(block, ({ one }) => ({
  user_blockerId: one(user, {
    fields: [block.blockerId],
    references: [user.id],
    relationName: "block_blockerId_user_id",
  }),
  user_blockingId: one(user, {
    fields: [block.blockingId],
    references: [user.id],
    relationName: "block_blockingId_user_id",
  }),
}));

export const likeRelations = relations(like, ({ one }) => ({
  post: one(post, {
    fields: [like.postId],
    references: [post.id],
  }),
  user: one(user, {
    fields: [like.userId],
    references: [user.id],
  }),
}));

export const flagRelations = relations(flag, ({ one }) => ({
  post: one(post, {
    fields: [flag.postId],
    references: [post.id],
  }),
  user: one(user, {
    fields: [flag.userId],
    references: [user.id],
  }),
}));

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
  id: text().notNull(),
  content: text().notNull(),
  userId: text().notNull(),
  createdAt: timestamp({ precision: 3, mode: "string" }).notNull(),
  parentId: text(),
  createdBy: text().notNull(),
  likeCount: integer().notNull(),
  commentCount: integer().notNull(),
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
