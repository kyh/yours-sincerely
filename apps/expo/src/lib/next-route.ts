import type { Href } from "expo-router";

/** Only known, parameterless routes are accepted as a post-sign-in
    destination. An exact-match allowlist is stricter than the web's
    `safeNextPath` origin check and is what keeps the result typed as `Href`
    without a cast. */
export const resolveNextRoute = (value?: string | string[]): Href => {
  if (value === undefined || Array.isArray(value)) {
    return "/";
  }
  switch (value) {
    case "/":
    case "/settings":
    case "/notifications":
    case "/profile": {
      return value;
    }
    default: {
      return "/";
    }
  }
};
