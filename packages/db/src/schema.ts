import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgSchema,
  pgTable,
  pgView,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";

export const tokenType = pgEnum("TokenType", [
  "REFRESH_TOKEN",
  "VERIFY_EMAIL",
  "RESET_PASSWORD",
]);
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
      providerProviderAccountIdKey: uniqueIndex(
        "Account_provider_providerAccountId_key",
      ).using(
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
    baseLikeCount: integer(),
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

// ----- NEW SCHEMA -----
const auth = pgSchema("auth");

export const authUsers = auth.table("users", (t) => ({
  id: uuid().primaryKey().notNull(),
  email: t.varchar({ length: 255 }),
  rawUserMetaData: t.jsonb(),
}));

export const feed = pgView("Feed", {
  id: text(),
  content: text(),
  userId: text(),
  createdAt: timestamp({ precision: 3, mode: "string" }),
  parentId: text(),
  createdBy: text(),
  likeCount: bigint({ mode: "number" }),
  commentCount: bigint({ mode: "number" }),
})
  .with({ securityInvoker: true })
  .as(
    sql`WITH flagged_posts AS ( SELECT "Flag"."postId" FROM "Flag" GROUP BY "Flag"."postId" HAVING count(*) > 3 ) SELECT p.id, p.content, p."userId", p."createdAt", p."parentId", p."createdBy", COALESCE(p."baseLikeCount", 0) + COALESCE(l.like_count, 0::bigint) AS "likeCount", COALESCE(c.comment_count, 0::bigint) AS "commentCount" FROM "Post" p LEFT JOIN ( SELECT "Like"."postId", count(*) AS like_count FROM "Like" GROUP BY "Like"."postId") l ON p.id = l."postId" LEFT JOIN ( SELECT "Post"."parentId", count(*) AS comment_count FROM "Post" GROUP BY "Post"."parentId") c ON p.id = c."parentId" WHERE NOT (p.id IN ( SELECT flagged_posts."postId" FROM flagged_posts)) AND p."createdAt" >= (CURRENT_DATE - '21 days'::interval) ORDER BY p."createdAt" DESC`,
  );

export const userStats = pgView("UserStats", {
  userId: text(),
  displayName: text(),
  totalPostCount: bigint({ mode: "number" }),
  totalLikeCount: bigint({ mode: "number" }),
  longestPostStreak: bigint({ mode: "number" }),
  currentPostStreak: bigint({ mode: "number" }),
})
  .with({ securityInvoker: true })
  .as(
    sql`WITH daily_posts AS ( SELECT "Post"."userId", date("Post"."createdAt") AS post_date FROM "Post" GROUP BY "Post"."userId", (date("Post"."createdAt")) ), streaks AS ( SELECT daily_posts."userId", daily_posts.post_date, daily_posts.post_date - row_number() OVER (PARTITION BY daily_posts."userId" ORDER BY daily_posts.post_date)::integer AS streak_group FROM daily_posts ), streak_lengths AS ( SELECT streaks."userId", streaks.streak_group, count(*) AS streak_length, max(streaks.post_date) AS streak_end FROM streaks GROUP BY streaks."userId", streaks.streak_group ), post_likes AS ( SELECT p.id AS "postId", p."userId", COALESCE(p."baseLikeCount", 0) + count(l."userId") AS total_likes FROM "Post" p LEFT JOIN "Like" l ON p.id = l."postId" GROUP BY p.id, p."userId", p."baseLikeCount" ) SELECT u.id AS "userId", u."displayName", COALESCE(post_count.total_posts, 0::bigint) AS "totalPostCount", COALESCE(like_count.total_likes, 0::numeric) AS "totalLikeCount", COALESCE(max(sl.streak_length), 0::bigint) AS "longestPostStreak", COALESCE(( SELECT sl2.streak_length FROM streak_lengths sl2 WHERE sl2."userId" = u.id AND sl2.streak_end = (( SELECT max(sl3.streak_end) AS max FROM streak_lengths sl3 WHERE sl3."userId" = u.id))), 0::bigint) AS "currentPostStreak" FROM "User" u LEFT JOIN ( SELECT "Post"."userId", count(*) AS total_posts FROM "Post" GROUP BY "Post"."userId") post_count ON u.id = post_count."userId" LEFT JOIN ( SELECT post_likes."userId", sum(post_likes.total_likes) AS total_likes FROM post_likes GROUP BY post_likes."userId") like_count ON u.id = like_count."userId" LEFT JOIN streak_lengths sl ON u.id = sl."userId" GROUP BY u.id, u."displayName", post_count.total_posts, like_count.total_likes`,
  );
