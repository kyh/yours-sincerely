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
    // Denormalized counters, maintained by triggers (migration 0004). They exist
    // because the Feed view used to re-aggregate all of "Like", all of "Post" and
    // all of "Flag" on EVERY page of EVERY feed request.
    //
    // Any new write path touching Like / Flag / child-Post must go through those
    // triggers, or these numbers drift. Drift is the failure mode of
    // denormalization and nobody notices it for weeks: keep the drift-check query
    // in `packages/db/src/drift-check.sql` runnable.
    /** Real `Like` rows for this post. NOT including `baseLikeCount`. */
    likeCount: integer().default(0).notNull(),
    /** Direct child posts. */
    commentCount: integer().default(0).notNull(),
    /** Flags that COUNT toward auto-hide — i.e. `Flag."countsTowardHide"` only,
        never a raw count of `Flag` rows. A raw count here would silently undo the
        censorship fix in migration 0003 and let four cookieless requests hide any
        post again. */
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
      tokenTypeKey: uniqueIndex("Token_token_type_key").using(
        "btree",
        table.token.asc().nullsLast().op("text_ops"),
        table.type.asc().nullsLast().op("text_ops"),
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
    countsTowardHide: boolean().default(false).notNull(),
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

/** Mirror of the deployed `Feed` view. It MUST stay byte-for-byte equivalent to
    the SQL in `supabase/migrations/` — these two have already drifted once.
 *
 *  Since migration 0004 this is a plain filtered projection: no CTE, no joins, no
 *  aggregation. It used to hash-aggregate ALL of "Like", ALL of "Post" and ALL of
 *  "Flag" to return five letters, on every page of every request. The counters on
 *  `Post` do that work incrementally instead.
 *
 *  `parentId` is nullable because the view keeps only root posts, so every row in
 *  it has a null parentId; declaring it `.notNull()` was a type-level lie.
 *
 *  There is deliberately NO `ORDER BY` here — `getFeed` orders, and the view's own
 *  ORDER BY forced the whole window to be sorted a second time. */
export const feed = pgView("Feed", {
  id: text().notNull(),
  content: text().notNull(),
  userId: text().notNull(),
  createdAt: timestamp({ precision: 3, mode: "string" }).notNull(),
  parentId: text(),
  createdBy: text().notNull(),
  likeCount: integer().notNull(),
  commentCount: integer().notNull(),
})
  .with({ securityInvoker: true })
  .as(
    sql`SELECT p.id, p.content, p."userId", p."createdAt", p."parentId", p."createdBy", COALESCE(p."baseLikeCount", 0) + p."likeCount" AS "likeCount", p."commentCount" AS "commentCount" FROM "Post" p WHERE p."flagCount" <= 3 AND p."createdAt" >= (CURRENT_DATE - '21 days'::interval) AND p."parentId" IS NULL`,
  );

// NOTE: the `UserStats` VIEW is gone (migration 0004). It computed streaks for
// EVERY user with a window function over every post in the table, and only then
// filtered to the one caller asked for — and it is fired on profile-link HOVER.
// It is now the `public."getUserStats"(text)` FUNCTION, which pushes the userId
// into the CTEs so the work is proportional to one user's posts. The streak logic
// inside it is a verbatim port; `packages/api/src/user/user-router.ts` calls it.
