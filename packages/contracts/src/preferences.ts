export type FeedLayout = "list" | "stack";

export const parseFeedLayout = (value: string | undefined): FeedLayout =>
  value === "stack" ? "stack" : "list";

export const nextFeedLayout = (value: FeedLayout): FeedLayout =>
  value === "list" ? "stack" : "list";

export type ThemeId = "system" | "light" | "dark" | "light-purple" | "dark-purple";
export type ResolvedThemeId = Exclude<ThemeId, "system">;

export const isThemeId = (value: string): value is ThemeId =>
  value === "system" ||
  value === "light" ||
  value === "dark" ||
  value === "light-purple" ||
  value === "dark-purple";

export const isDarkThemeId = (value: string | undefined) =>
  value === "dark" || value === "dark-purple";
