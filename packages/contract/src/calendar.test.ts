import assert from "node:assert/strict";
import test from "node:test";

import { addDays, eachDayOfInterval, format, parseISO } from "date-fns";

import type { CalendarDay, CalendarPost } from "./calendar.ts";
import {
  calendarLevelColor,
  createPostsDailyActivity,
  createPostsHeatmap,
  getCalendarMonthLabels,
  groupCalendarDaysByWeeks,
  PROFILE_CALENDAR_THEMES,
} from "./calendar.ts";

// 2026-06-01 is a Monday. All fixed dates below anchor to that week.
const emptyDays = (from: string, to: string): CalendarDay[] =>
  eachDayOfInterval({ end: parseISO(to), start: parseISO(from) }).map((day) => ({
    count: 0,
    date: format(day, "yyyy-MM-dd"),
    level: 0,
  }));

/** A server timestamp at noon UTC. Noon UTC lands on the same calendar day in every
    timezone this suite runs under (UTC, +09:00, -07:00), so the local-time formatting
    inside the heatmap stays deterministic. */
const atNoon = (day: string): CalendarPost => ({ createdAt: `${day} 12:00:00.000` });

const NOW = new Date(2026, 5, 15, 12);
const daysFromNow = (offset: number) => format(addDays(NOW, offset), "yyyy-MM-dd");

// --- groupCalendarDaysByWeeks -----------------------------------------------

test("weeks are padded to start on Sunday", () => {
  // 2026-06-01 is a Monday, so a Sunday-start calendar needs one leading blank.
  const weeks = groupCalendarDaysByWeeks(emptyDays("2026-06-01", "2026-06-14"));

  assert.equal(weeks.length, 3);
  assert.equal(weeks[0]?.length, 7);
  assert.equal(weeks[0]?.[0], undefined, "Sunday slot before Monday 06-01 must be blank");
  assert.equal(weeks[0]?.[1]?.date, "2026-06-01");
  assert.equal(weeks[1]?.[0]?.date, "2026-06-07");
  assert.equal(weeks[2]?.[0]?.date, "2026-06-14");
});

test("gaps between supplied days are filled with empty days", () => {
  const weeks = groupCalendarDaysByWeeks([
    { count: 2, date: "2026-06-01", level: 4 },
    { count: 1, date: "2026-06-05", level: 1 },
  ]);

  const days = weeks.flat();
  assert.equal(days[1]?.date, "2026-06-01");
  assert.equal(days[1]?.count, 2);
  // 06-02..06-04 were never supplied; they are materialized at zero.
  assert.deepEqual(days[2], { count: 0, date: "2026-06-02", level: 0 });
  assert.deepEqual(days[3], { count: 0, date: "2026-06-03", level: 0 });
  assert.deepEqual(days[4], { count: 0, date: "2026-06-04", level: 0 });
  assert.equal(days[5]?.count, 1);
});

test("an empty day list produces no weeks", () => {
  assert.deepEqual(groupCalendarDaysByWeeks([]), []);
});

// --- getCalendarMonthLabels -------------------------------------------------

test("month labels mark the first week of each month", () => {
  const weeks = groupCalendarDaysByWeeks(emptyDays("2026-06-01", "2026-09-15"));

  assert.deepEqual(getCalendarMonthLabels(weeks), [
    { text: "Jun", x: 0, y: 0 },
    { text: "Jul", x: 5, y: 0 },
    { text: "Aug", x: 9, y: 0 },
    { text: "Sep", x: 14, y: 0 },
  ]);
});

test("a crowded first label is dropped", () => {
  // Starting 2026-06-24 leaves June occupying only 2 weeks, so the "Jun" label at x=0
  // would collide with "Jul" at x=2. The index-0 filter requires a gap of more than two
  // weeks, so "Jun" is dropped and "Jul" leads.
  const weeks = groupCalendarDaysByWeeks(emptyDays("2026-06-24", "2026-09-15"));

  assert.deepEqual(getCalendarMonthLabels(weeks), [
    { text: "Jul", x: 2, y: 0 },
    { text: "Aug", x: 6, y: 0 },
    { text: "Sep", x: 11, y: 0 },
  ]);
});

// --- createPostsHeatmap -----------------------------------------------------

test("the heatmap counts posts per day and drops posts outside the window", () => {
  const posts: CalendarPost[] = [
    atNoon(daysFromNow(-3)),
    atNoon(daysFromNow(-3)),
    atNoon(daysFromNow(-3)),
    atNoon(daysFromNow(-5)),
    // far outside a 200-day window — must be discarded
    atNoon(daysFromNow(-400)),
  ];

  const { stats, max } = createPostsHeatmap(posts, 200, NOW);

  // eachDayOfInterval is inclusive on both ends: 200 days back plus today.
  assert.equal(stats.length, 201);
  assert.equal(max, 3);

  const byDate = new Map(stats.map((day) => [day.date, day]));
  assert.equal(byDate.get(daysFromNow(-3))?.count, 3);
  assert.equal(byDate.get(daysFromNow(-5))?.count, 1);
  assert.equal(byDate.get(daysFromNow(-1))?.count, 0);
  assert.equal(byDate.has(daysFromNow(-400)), false);

  // Total counted posts = 4; the 400-day-old post was dropped, not clamped into the window.
  assert.equal(
    stats.reduce((total, day) => total + day.count, 0),
    4,
  );
});

test("heatmap levels follow the 0.3 / 0.6 / 0.9 thresholds of the day's max", () => {
  // getPostLevel is private; it is exercised through the levels it produces here.
  // With max = 10: 0 → 0, <3 → 1, <6 → 2, <9 → 3, else 4.
  // 10 → level 4; 1 → level 1; 3 → level 2 (0.3 is exclusive);
  // 6 → level 3 (0.6 is exclusive); 9 → level 4 (0.9 is exclusive).
  const posts = [
    ...Array.from({ length: 10 }, () => atNoon(daysFromNow(-1))),
    ...Array.from({ length: 1 }, () => atNoon(daysFromNow(-2))),
    ...Array.from({ length: 3 }, () => atNoon(daysFromNow(-3))),
    ...Array.from({ length: 6 }, () => atNoon(daysFromNow(-4))),
    ...Array.from({ length: 9 }, () => atNoon(daysFromNow(-5))),
  ];

  const { stats, max } = createPostsHeatmap(posts, 30, NOW);
  const byDate = new Map(stats.map((day) => [day.date, day]));
  assert.equal(max, 10);

  assert.equal(byDate.get(daysFromNow(-1))?.level, 4);
  assert.equal(byDate.get(daysFromNow(-2))?.level, 1);
  assert.equal(byDate.get(daysFromNow(-3))?.level, 2);
  assert.equal(byDate.get(daysFromNow(-4))?.level, 3);
  assert.equal(byDate.get(daysFromNow(-5))?.level, 4);
  assert.equal(byDate.get(daysFromNow(-6))?.level, 0);
});

test("an empty heatmap has a zero max and all-zero levels", () => {
  const { stats, max } = createPostsHeatmap([], 10, NOW);

  assert.equal(max, 0);
  assert.equal(stats.length, 11);
  assert.ok(stats.every((day) => day.count === 0 && day.level === 0));
});

// --- createPostsDailyActivity -----------------------------------------------

test("daily activity aggregates posts by weekday", () => {
  // 2026-06-01 is a Monday, so 06-01..06-07 is exactly Mon..Sun.
  // Mon 10 → level 4, and the max; Tue 1 → level 1; Wed 4 → level 2;
  // Thu 8 → level 3; Fri (06-05) left empty → level 0;
  // Sat 3 → level 2 (0.3 exclusive); Sun 6 → level 3 (0.6 exclusive).
  const posts = [
    ...Array.from({ length: 10 }, () => atNoon("2026-06-01")),
    ...Array.from({ length: 1 }, () => atNoon("2026-06-02")),
    ...Array.from({ length: 4 }, () => atNoon("2026-06-03")),
    ...Array.from({ length: 8 }, () => atNoon("2026-06-04")),
    ...Array.from({ length: 3 }, () => atNoon("2026-06-06")),
    ...Array.from({ length: 6 }, () => atNoon("2026-06-07")),
  ];

  const { stats, max } = createPostsDailyActivity(posts);

  assert.deepEqual(max, { day: "Mon", max: 10 });
  assert.deepEqual(stats.Mon, { count: 10, level: 4 });
  assert.deepEqual(stats.Tue, { count: 1, level: 1 });
  assert.deepEqual(stats.Wed, { count: 4, level: 2 });
  assert.deepEqual(stats.Thu, { count: 8, level: 3 });
  assert.deepEqual(stats.Fri, { count: 0, level: 0 });
  assert.deepEqual(stats.Sat, { count: 3, level: 2 });
  assert.deepEqual(stats.Sun, { count: 6, level: 3 });
});

test("daily activity with no posts reports no busiest day", () => {
  const { stats, max } = createPostsDailyActivity([]);

  assert.deepEqual(max, { day: "none", max: 0 });
  assert.equal(Object.keys(stats).length, 7);
  assert.ok(Object.values(stats).every((day) => day.count === 0 && day.level === 0));
});

test("daily activity buckets a zone-less timestamp by its UTC instant", () => {
  // Guards the shared parseServerDate: "2026-06-01 12:00:00.000" is noon UTC (Monday),
  // never noon local. A bare `new Date()` here would drift the weekday at the edges.
  const { max } = createPostsDailyActivity([atNoon("2026-06-01")]);
  assert.deepEqual(max, { day: "Mon", max: 1 });
});

// --- theme ------------------------------------------------------------------

test("calendarLevelColor maps every level to its theme colour", () => {
  const theme = PROFILE_CALENDAR_THEMES.light;
  assert.equal(calendarLevelColor(theme, 0), theme.level0);
  assert.equal(calendarLevelColor(theme, 1), theme.level1);
  assert.equal(calendarLevelColor(theme, 2), theme.level2);
  assert.equal(calendarLevelColor(theme, 3), theme.level3);
  assert.equal(calendarLevelColor(theme, 4), theme.level4);
});

test("profile calendar themes are complete hex ramps in both appearances", () => {
  const HEX = /^#[0-9a-f]{6}$/u;
  for (const theme of [PROFILE_CALENDAR_THEMES.light, PROFILE_CALENDAR_THEMES.dark]) {
    const levels = ([0, 1, 2, 3, 4] as const).map((level) => calendarLevelColor(theme, level));
    for (const color of [...levels, theme.stroke]) {
      assert.match(color, HEX);
    }
    assert.equal(new Set(levels).size, levels.length);
  }
});
