export enum Theme {
  DARK = "dark",
  LIGHT = "light",
}

export const themes: Array<Theme> = Object.values(Theme);

export const isTheme = (value: unknown): value is Theme => {
  return typeof value === "string" && themes.includes(value as Theme);
};
