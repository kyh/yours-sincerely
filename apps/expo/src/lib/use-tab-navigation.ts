import { useRouter, useSegments } from "expo-router";
import type { Href } from "expo-router";

type TabPath = "/" | "/notifications" | "/profile";
export type TabHref = TabPath | (Exclude<Href, string> & { pathname: TabPath });

export const isTabHref = (href: Href): href is TabHref => {
  const pathname = typeof href === "string" ? href : href.pathname;
  return pathname === "/" || pathname === "/notifications" || pathname === "/profile";
};

/** Select an existing tab; leaving a detail must also unwind its native stack. */
export const useTabNavigation = () => {
  const router = useRouter();
  const segments = useSegments();

  return (href: TabHref) => {
    if (segments[0] === "(tabs)") {
      router.navigate(href);
    } else {
      router.dismissTo(href);
    }
  };
};
