import type { Href } from "expo-router";
import { safeNextPath } from "@repo/contracts/navigation";

/** Keep the web's safe redirect behavior, then map supported destinations
    to typed native routes. Unknown web-only pages return to the feed. */
export const resolveNextRoute = (value?: string | string[]): Href => {
  const url = new URL(safeNextPath(value), "https://next-route.invalid");
  const params = Object.fromEntries(url.searchParams);
  switch (url.pathname) {
    case "/":
    case "/settings":
    case "/notifications":
    case "/profile": {
      return url.search === "" ? url.pathname : { params, pathname: url.pathname };
    }
    default: {
      break;
    }
  }

  const [, route, segment, extra] = url.pathname.split("/");
  if (segment === undefined || segment === "" || extra !== undefined) {
    return "/";
  }

  let id: string;
  try {
    id = decodeURIComponent(segment);
  } catch {
    return "/";
  }
  if (id.includes("/") || id.includes("\\")) {
    return "/";
  }

  if (route === "posts") {
    return { params: { ...params, "post-id": id }, pathname: "/posts/[post-id]" };
  }
  if (route === "profile") {
    return { params: { ...params, "user-id": id }, pathname: "/profile/[user-id]" };
  }
  return "/";
};
