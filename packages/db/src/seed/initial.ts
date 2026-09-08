/**
 * Seeds a dataset big enough to make the hot read paths honest under EXPLAIN,
 * and shaped so the profile stats have something to be wrong about.
 *
 * Deterministic: the RNG is seeded, so two runs produce the same data and a
 * before/after characterization of `Feed` and `getUserStats` compares like for like.
 *
 * Run with: pnpm -F db seed
 */
import { randomUUID } from "node:crypto";

import { db } from "../drizzle-client";
import { block, flag, like, post, user } from "../drizzle-schema";

const USER_COUNT = 200;
const ROOT_POSTS_PER_ACTIVE_USER = 30;
const COMMENT_COUNT = 2000;
const LIKE_COUNT = 40_000;
const FLAG_COUNT = 400;
/** Posts are spread over this many days. The feed only shows the last 21, so
    this deliberately leaves most of the table outside the feed window — which is
    exactly the shape that makes a full-table aggregate expensive. */
const HISTORY_DAYS = 365;

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

/** mulberry32 — small, seeded, good enough for fixture data. */
/* oxlint-disable no-bitwise -- mulberry32 is int32 bit math; `| 0` is the wrap, not a truncation */
const createRandom = (seed: number) => {
  let state = seed;
  return () => {
    // oxlint-disable-next-line unicorn/prefer-math-trunc -- `| 0` wraps to int32; Math.trunc would not
    state = (state + 0x6d_2b_79_f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
};
/* oxlint-enable no-bitwise */

const random = createRandom(20_260_712);
const pick = <T>(items: T[]): T => {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) {
    throw new Error("pick from an empty list");
  }
  return item;
};

const now = Date.now();
const at = (msAgo: number) => new Date(now - msAgo).toISOString();

/** Streak patterns `getUserStats` must get right. Index 0..5 of the user list
    gets one of these; everyone else gets scattered posts. */
type StreakPattern = "none" | "single" | "current-run" | "broken" | "past-run" | "same-day";
const STREAK_PATTERNS: StreakPattern[] = [
  // No posts at all.
  "none",
  // Exactly one post.
  "single",
  // 10 consecutive days ending today → current streak = longest = 10.
  "current-run",
  // A run, a gap, a shorter recent run.
  "broken",
  // A long run that ended months ago → longest >> current.
  "past-run",
  // Several posts on one day → one day, not several.
  "same-day",
];

/** Writes one author's posts in the shape a streak pattern needs. */
const writeStreakPattern = (pattern: StreakPattern, addPost: (msAgo: number) => void) => {
  const write = (daysAgo: number) => addPost(daysAgo * DAY_MS + 12 * HOUR_MS);

  switch (pattern) {
    case "none": {
      break;
    }
    case "single": {
      write(3);
      break;
    }
    case "current-run": {
      for (let day = 0; day < 10; day += 1) {
        write(day);
      }
      break;
    }
    case "broken": {
      for (let day = 0; day < 3; day += 1) {
        write(day);
      }
      for (let day = 20; day < 27; day += 1) {
        write(day);
      }
      break;
    }
    case "past-run": {
      for (let day = 100; day < 115; day += 1) {
        write(day);
      }
      break;
    }
    case "same-day": {
      for (let n = 0; n < 5; n += 1) {
        addPost(5 * DAY_MS + n * 1000);
      }
      break;
    }
    default: {
      throw new Error(`Unknown streak pattern: ${String(pattern)}`);
    }
  }
};

const seed = async () => {
  console.log("Seeding…");

  const users = Array.from({ length: USER_COUNT }, (_, index) => ({
    createdAt: at((HISTORY_DAYS + 30) * DAY_MS),
    displayName: `Seed user ${index}`,
    // Every third user is registered; the rest are anonymous. The flag rule
    // (isEstablishedFlagger) cares about this.
    email: index % 3 === 0 ? `seed-${index}@example.com` : null,
    id: randomUUID(),
  }));
  await db.insert(user).values(users);
  console.log(`  ${users.length} users`);

  const posts: (typeof post.$inferInsert)[] = [];
  const addPost = (userId: string, displayName: string, msAgo: number, parentId?: string) => {
    const row = {
      baseLikeCount: random() < 0.1 ? Math.floor(random() * 50) : null,
      content: `A letter written ${Math.round(msAgo / DAY_MS)} days ago. ${"Words ".repeat(20)}`,
      createdAt: at(msAgo),
      createdBy: displayName,
      id: randomUUID(),
      parentId,
      updatedAt: at(msAgo),
      userId,
    };
    posts.push(row);
    return row;
  };

  // Deliberate streak patterns.
  for (const [index, pattern] of STREAK_PATTERNS.entries()) {
    const author = users[index];
    if (author !== undefined) {
      writeStreakPattern(pattern, (msAgo) => addPost(author.id, author.displayName, msAgo));
    }
  }

  // Everyone else writes scattered letters across the history window.
  const activeUsers = users.slice(STREAK_PATTERNS.length);
  for (const author of activeUsers) {
    for (let n = 0; n < ROOT_POSTS_PER_ACTIVE_USER; n += 1) {
      addPost(author.id, author.displayName, Math.floor(random() * HISTORY_DAYS * DAY_MS));
    }
  }

  const rootPosts = [...posts];
  for (let n = 0; n < COMMENT_COUNT; n += 1) {
    const parent = pick(rootPosts);
    const author = pick(users);
    const parentAgeMs = now - new Date(`${parent.createdAt ?? ""}`).getTime();
    addPost(author.id, author.displayName, Math.max(0, parentAgeMs - HOUR_MS), parent.id);
  }

  for (let index = 0; index < posts.length; index += 1000) {
    await db.insert(post).values(posts.slice(index, index + 1000));
  }
  console.log(`  ${posts.length} posts (${rootPosts.length} roots, ${COMMENT_COUNT} comments)`);

  // Likes: unique on (postId, userId), so dedupe before inserting.
  const likeKeys = new Set<string>();
  const likes: (typeof like.$inferInsert)[] = [];
  while (likes.length < LIKE_COUNT) {
    const target = pick(posts);
    const liker = pick(users);
    const key = `${target.id}:${liker.id}`;
    if (likeKeys.has(key)) {
      continue;
    }
    likeKeys.add(key);
    likes.push({ postId: target.id, updatedAt: at(0), userId: liker.id });
  }
  for (let index = 0; index < likes.length; index += 2000) {
    await db.insert(like).values(likes.slice(index, index + 2000));
  }
  console.log(`  ${likes.length} likes`);

  // Flags: same composite key. The BEFORE INSERT trigger decides which of these
  // count toward auto-hide — the seed never sets `countsTowardHide` itself.
  const flagKeys = new Set<string>();
  const flags: (typeof flag.$inferInsert)[] = [];
  while (flags.length < FLAG_COUNT) {
    const target = pick(posts);
    const flagger = pick(users);
    const key = `${target.id}:${flagger.id}`;
    if (flagKeys.has(key)) {
      continue;
    }
    flagKeys.add(key);
    flags.push({
      comment: "Seeded report",
      postId: target.id,
      updatedAt: at(0),
      userId: flagger.id,
    });
  }
  await db.insert(flag).values(flags);
  console.log(`  ${flags.length} flags`);

  const blockKeys = new Set<string>();
  const blocks: (typeof block.$inferInsert)[] = [];
  while (blocks.length < 50) {
    const blocker = pick(users);
    const blocking = pick(users);
    if (blocker.id === blocking.id) {
      continue;
    }
    const key = `${blocker.id}:${blocking.id}`;
    if (blockKeys.has(key)) {
      continue;
    }
    blockKeys.add(key);
    blocks.push({ blockerId: blocker.id, blockingId: blocking.id });
  }
  await db.insert(block).values(blocks);
  console.log(`  ${blocks.length} blocks`);

  console.log("Done.");
  await db.$client.end();
};

try {
  await seed();
} catch (error) {
  console.error(error);
  process.exit(1);
}
