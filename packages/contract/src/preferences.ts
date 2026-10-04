export type FeedLayout = "list" | "stack";

export const parseFeedLayout = (value: string | undefined): FeedLayout =>
  value === "stack" ? "stack" : "list";

export const nextFeedLayout = (value: FeedLayout): FeedLayout =>
  value === "list" ? "stack" : "list";

export const THEME_IDS = ["system", "light", "dark", "light-purple", "dark-purple"] as const;

export type ThemeId = (typeof THEME_IDS)[number];
export type ResolvedThemeId = Exclude<ThemeId, "system">;

export const THEME_LABELS = {
  dark: "Dark",
  "dark-purple": "Dark Purple",
  light: "Light",
  "light-purple": "Light Purple",
  system: "System",
} satisfies Record<ThemeId, string>;

export const isThemeId = (value: string): value is ThemeId =>
  THEME_IDS.some((themeId) => themeId === value);

export const isDarkThemeId = (value: string | undefined) =>
  value === "dark" || value === "dark-purple";
