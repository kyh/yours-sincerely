import assert from "node:assert/strict";
import test from "node:test";

import { addDays, eachDayOfInterval, format, parseISO } from "date-fns";

import type { CalendarDay, CalendarPost } from "./calendar.ts";
import {
  calendarLevelColor,
  createPostsDailyActivity,
  createPostsHeatmap,
  DEFAULT_CALENDAR_THEME,
  generateEmptyCalendarData,
  getCalendarMonthLabels,
  getCalendarTheme,
  groupCalendarDaysByWeeks,
  MIN_DISTANCE_MONTH_LABELS,
} from "./calendar.ts";

// 2026-06-01 is a Monday. All fixed dates below anchor to that week.
const emptyDays = (from: string, to: string): CalendarDay[] =>
  eachDayOfInterval({ start: parseISO(from), end: parseISO(to) }).map((day) => ({
    date: format(day, "yyyy-MM-dd"),
    count: 0,
    level: 0,
  }));

/** A server timestamp at noon UTC. Noon UTC lands on the same calendar day in every
    timezone this suite runs under (UTC, +09:00, -07:00), so the local-time formatting
    inside the heatmap stays deterministic. */
const atNoon = (day: string): CalendarPost => ({ createdAt: `${day} 12:00:00.000` });

/** The heatmap window is built from `new Date()` internally — it takes no `now`
    parameter — so its inputs must be expressed relative to today. */
const daysFromToday = (offset: number) => format(addDays(new Date(), offset), "yyyy-MM-dd");

// --- groupCalendarDaysByWeeks -----------------------------------------------

test("weeks are padded to the week start (default Sunday)", () => {
  // 2026-06-01 is a Monday, so a Sunday-start calendar needs one leading blank.
  const weeks = groupCalendarDaysByWeeks(emptyDays("2026-06-01", "2026-06-14"));

  assert.equal(weeks.length, 3);
  assert.equal(weeks[0]?.length, 7);
  assert.equal(weeks[0]?.[0], undefined, "Sunday slot before Monday 06-01 must be blank");
  assert.equal(weeks[0]?.[1]?.date, "2026-06-01");
  assert.equal(weeks[1]?.[0]?.date, "2026-06-07");
  assert.equal(weeks[2]?.[0]?.date, "2026-06-14");
});

test("weekStart shifts the padding", () => {
  // With a Monday week start, a range beginning on Monday needs no padding at all.
  const weeks = groupCalendarDaysByWeeks(emptyDays("2026-06-01", "2026-06-14"), 1);

  assert.equal(weeks.length, 2);
  assert.equal(weeks[0]?.[0]?.date, "2026-06-01");
  assert.equal(weeks[1]?.[0]?.date, "2026-06-08");
  assert.ok(
    weeks.every((week) => week.every((day) => day !== undefined)),
    "no padding expected",
  );
});

test("gaps between supplied days are filled with empty days", () => {
  const weeks = groupCalendarDaysByWeeks([
    { date: "2026-06-01", count: 2, level: 4 },
    { date: "2026-06-05", count: 1, level: 1 },
  ]);

  const days = weeks.flat();
  assert.equal(days[1]?.date, "2026-06-01");
  assert.equal(days[1]?.count, 2);
  // 06-02..06-04 were never supplied; they are materialized at zero.
  assert.deepEqual(days[2], { date: "2026-06-02", count: 0, level: 0 });
  assert.deepEqual(days[3], { date: "2026-06-03", count: 0, level: 0 });
  assert.deepEqual(days[4], { date: "2026-06-04", count: 0, level: 0 });
  assert.equal(days[5]?.count, 1);
});

test("an empty day list produces no weeks", () => {
  assert.deepEqual(groupCalendarDaysByWeeks([]), []);
});

// --- getCalendarMonthLabels -------------------------------------------------

test("month labels mark the first week of each month", () => {
  const weeks = groupCalendarDaysByWeeks(emptyDays("2026-06-01", "2026-09-15"));

  assert.deepEqual(getCalendarMonthLabels(weeks), [
    { x: 0, y: 0, text: "Jun" },
    { x: 5, y: 0, text: "Jul" },
    { x: 9, y: 0, text: "Aug" },
    { x: 14, y: 0, text: "Sep" },
  ]);
});

test("a crowded first label is dropped", () => {
  // Starting 2026-06-24 leaves June occupying only 2 weeks, so the "Jun" label at x=0
  // would collide with "Jul" at x=2. The index-0 filter requires a gap strictly greater
  // than MIN_DISTANCE_MONTH_LABELS, so "Jun" is dropped and "Jul" leads.
  const weeks = groupCalendarDaysByWeeks(emptyDays("2026-06-24", "2026-09-15"));
  const labels = getCalendarMonthLabels(weeks);

  assert.deepEqual(labels, [
    { x: 2, y: 0, text: "Jul" },
    { x: 6, y: 0, text: "Aug" },
    { x: 11, y: 0, text: "Sep" },
  ]);
  const [first, second] = labels;
  assert.ok(first !== undefined && second !== undefined);
  assert.ok(second.x - first.x > MIN_DISTANCE_MONTH_LABELS);
});

test("custom month names are honoured", () => {
  const weeks = groupCalendarDaysByWeeks(emptyDays("2026-06-01", "2026-09-15"));
  const names = [
    "1月",
    "2月",
    "3月",
    "4月",
    "5月",
    "6月",
    "7月",
    "8月",
    "9月",
    "10月",
    "11月",
    "12月",
  ];

  assert.deepEqual(
    getCalendarMonthLabels(weeks, names).map((label) => label.text),
    ["6月", "7月", "8月", "9月"],
  );
});

// --- createPostsHeatmap -----------------------------------------------------

test("the heatmap counts posts per day and drops posts outside the window", () => {
  const posts: CalendarPost[] = [
    atNoon(daysFromToday(-3)),
    atNoon(daysFromToday(-3)),
    atNoon(daysFromToday(-3)),
    atNoon(daysFromToday(-5)),
    atNoon(daysFromToday(-400)), // far outside a 200-day window — must be discarded
  ];

  const { stats, max } = createPostsHeatmap(posts, 200);

  // eachDayOfInterval is inclusive on both ends: 200 days back plus today.
  assert.equal(stats.length, 201);
  assert.equal(max, 3);

  const byDate = new Map(stats.map((day) => [day.date, day]));
  assert.equal(byDate.get(daysFromToday(-3))?.count, 3);
  assert.equal(byDate.get(daysFromToday(-5))?.count, 1);
  assert.equal(byDate.get(daysFromToday(-1))?.count, 0);
  assert.equal(byDate.has(daysFromToday(-400)), false);

  // Total counted posts = 4; the 400-day-old post was dropped, not clamped into the window.
  assert.equal(
    stats.reduce((total, day) => total + day.count, 0),
    4,
  );
});

test("heatmap levels follow the 0.3 / 0.6 / 0.9 thresholds of the day's max", () => {
  // getPostLevel is private; it is exercised through the levels it produces here.
  // With max = 10: 0 → 0, <3 → 1, <6 → 2, <9 → 3, else 4.
  const posts = [
    ...Array.from({ length: 10 }, () => atNoon(daysFromToday(-1))), // 10 → level 4
    ...Array.from({ length: 1 }, () => atNoon(daysFromToday(-2))), //   1 → level 1
    ...Array.from({ length: 3 }, () => atNoon(daysFromToday(-3))), //   3 → level 2 (0.3 is exclusive)
    ...Array.from({ length: 6 }, () => atNoon(daysFromToday(-4))), //   6 → level 3 (0.6 is exclusive)
    ...Array.from({ length: 9 }, () => atNoon(daysFromToday(-5))), //   9 → level 4 (0.9 is exclusive)
  ];

  const { stats, max } = createPostsHeatmap(posts, 30);
  const byDate = new Map(stats.map((day) => [day.date, day]));
  assert.equal(max, 10);

  assert.equal(byDate.get(daysFromToday(-1))?.level, 4);
  assert.equal(byDate.get(daysFromToday(-2))?.level, 1);
  assert.equal(byDate.get(daysFromToday(-3))?.level, 2);
  assert.equal(byDate.get(daysFromToday(-4))?.level, 3);
  assert.equal(byDate.get(daysFromToday(-5))?.level, 4);
  assert.equal(byDate.get(daysFromToday(-6))?.level, 0);
});

test("an empty heatmap has a zero max and all-zero levels", () => {
  const { stats, max } = createPostsHeatmap([], 10);

  assert.equal(max, 0);
  assert.equal(stats.length, 11);
  assert.ok(stats.every((day) => day.count === 0 && day.level === 0));
});

// --- createPostsDailyActivity -----------------------------------------------

test("daily activity aggregates posts by weekday", () => {
  // 2026-06-01 is a Monday, so 06-01..06-07 is exactly Mon..Sun.
  const posts = [
    ...Array.from({ length: 10 }, () => atNoon("2026-06-01")), // Mon → level 4, and the max
    ...Array.from({ length: 1 }, () => atNoon("2026-06-02")), // Tue → level 1
    ...Array.from({ length: 4 }, () => atNoon("2026-06-03")), // Wed → level 2
    ...Array.from({ length: 8 }, () => atNoon("2026-06-04")), // Thu → level 3
    // Fri (06-05) left empty  → level 0
    ...Array.from({ length: 3 }, () => atNoon("2026-06-06")), // Sat → level 2 (0.3 exclusive)
    ...Array.from({ length: 6 }, () => atNoon("2026-06-07")), // Sun → level 3 (0.6 exclusive)
  ];

  const { stats, max } = createPostsDailyActivity(posts);

  assert.deepEqual(max, { max: 10, day: "Mon" });
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

  assert.deepEqual(max, { max: 0, day: "none" });
  assert.equal(Object.keys(stats).length, 7);
  assert.ok(Object.values(stats).every((day) => day.count === 0 && day.level === 0));
});

test("daily activity buckets a zone-less timestamp by its UTC instant", () => {
  // Guards the shared parseServerDate: "2026-06-01 12:00:00.000" is noon UTC (Monday),
  // never noon local. A bare `new Date()` here would drift the weekday at the edges.
  const { max } = createPostsDailyActivity([atNoon("2026-06-01")]);
  assert.deepEqual(max, { max: 1, day: "Mon" });
});

// --- theme + scaffolding ----------------------------------------------------

test("calendarLevelColor maps every level to its theme colour", () => {
  assert.equal(calendarLevelColor(DEFAULT_CALENDAR_THEME, 0), DEFAULT_CALENDAR_THEME.level0);
  assert.equal(calendarLevelColor(DEFAULT_CALENDAR_THEME, 1), DEFAULT_CALENDAR_THEME.level1);
  assert.equal(calendarLevelColor(DEFAULT_CALENDAR_THEME, 2), DEFAULT_CALENDAR_THEME.level2);
  assert.equal(calendarLevelColor(DEFAULT_CALENDAR_THEME, 3), DEFAULT_CALENDAR_THEME.level3);
  assert.equal(calendarLevelColor(DEFAULT_CALENDAR_THEME, 4), DEFAULT_CALENDAR_THEME.level4);
});

test("getCalendarTheme falls back to the default", () => {
  assert.equal(getCalendarTheme(), DEFAULT_CALENDAR_THEME);
  assert.equal(getCalendarTheme(undefined), DEFAULT_CALENDAR_THEME);

  const custom = { ...DEFAULT_CALENDAR_THEME, level0: "#000000" };
  assert.equal(getCalendarTheme(custom), custom);
});

test("generateEmptyCalendarData covers a whole year", () => {
  const days = generateEmptyCalendarData(2026);

  assert.equal(days.length, 365);
  assert.equal(days[0]?.date, "2026-01-01");
  assert.equal(days[days.length - 1]?.date, "2026-12-31");
  assert.ok(days.every((day) => day.count === 0 && day.level === 0));

  assert.equal(generateEmptyCalendarData(2028).length, 366, "leap year");
});
