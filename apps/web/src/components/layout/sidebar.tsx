"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { buttonVariants } from "@repo/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import type { AnimationItem } from "lottie-web/build/player/lottie_light";

import { useWorkspaceUser } from "@/lib/use-workspace-user";
import { orpc } from "@/orpc/react";

// The light player has no expression engine: the icon JSONs have theirs baked
// into keyframes, and sidebar-icons.test.ts keeps it that way.
const loadLottie = async () => {
  const { default: lottie } = await import("lottie-web/build/player/lottie_light");
  return lottie;
};

const useLottieIcon = (path: string) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<AnimationItem>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    let animation: AnimationItem | undefined;
    let cancelled = false;
    const mount = async () => {
      const lottie = await loadLottie();
      if (cancelled) {
        return;
      }
      animation = lottie.loadAnimation({
        autoplay: false,
        container,
        loop: false,
        path,
        renderer: "svg",
      });
      // A finished animation parks on its last frame, where play() is a no-op.
      animation.addEventListener("complete", () => animation?.goToAndStop(0, true));
      animationRef.current = animation;
    };
    void mount();
    return () => {
      cancelled = true;
      animation?.destroy();
      animationRef.current = null;
    };
  }, [path]);

  const handleMouseEnter = () => {
    if (window.matchMedia("(hover: hover)").matches) {
      animationRef.current?.play();
    }
  };

  return [containerRef, handleMouseEnter] as const;
};

export const Sidebar = () => {
  const user = useWorkspaceUser();
  const unread = useQuery({
    ...orpc.notification.unreadCount.queryOptions(),
    enabled: user !== null,
    refetchInterval: 60_000,
    // "always", not the default: a badge must be right the moment the tab is
    // looked at again, and the 30s SSR staleTime would skip that refetch.
    refetchOnWindowFocus: "always",
  });
  const unreadCount = user === null ? 0 : (unread.data?.count ?? 0);

  const iconClassName = "block size-6 dark:invert";
  const [homeIconRef, handleHomeMouseEnter] = useLottieIcon("/icons/home-icon.json");
  const [bellIconRef, handleBellMouseEnter] = useLottieIcon("/icons/bell-icon.json");
  const [userIconRef, handleUserMouseEnter] = useLottieIcon("/icons/user-icon.json");

  return (
    <section className="area-nav">
      <nav className="bg-background flex w-full items-start justify-around gap-1 px-2 pb-2 md:-ml-4 md:w-auto md:flex-col md:px-0 md:py-5">
        <Link
          href="/"
          className={buttonVariants({ variant: "ghost" })}
          onMouseEnter={handleHomeMouseEnter}
        >
          <span ref={homeIconRef} className={iconClassName} aria-hidden="true" />
          <span className="sr-only md:not-sr-only">Home</span>
        </Link>
        <Link
          href="/notifications"
          className={buttonVariants({ variant: "ghost" })}
          onMouseEnter={handleBellMouseEnter}
        >
          <span className="relative">
            <span ref={bellIconRef} className={iconClassName} aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="bg-destructive animate-in fade-in zoom-in absolute -top-0.5 -right-0.5 size-1.5 rounded-full" />
            )}
          </span>
          <span className="sr-only md:not-sr-only">Notifications</span>
        </Link>
        <Link
          href={user ? `/profile/${user.id}` : `/auth/sign-up`}
          className={buttonVariants({ variant: "ghost" })}
          onMouseEnter={handleUserMouseEnter}
        >
          <span ref={userIconRef} className={iconClassName} aria-hidden="true" />
          <span className="sr-only md:not-sr-only">Profile</span>
        </Link>
      </nav>
      <footer className="border-t-border mt-auto hidden flex-col gap-2 border-t py-4 text-xs md:flex">
        <div>
          ©{new Date().getFullYear()}, Made with{" "}
          <a
            className="hover:underline"
            href="https://github.com/kyh/yours-sincerely"
            target="_blank"
            rel="noreferrer"
          >
            💻
          </a>
        </div>
        <div className="flex gap-2">
          <Link href="/about" className="inline-block hover:underline">
            About
          </Link>
          <Link href="/privacy" className="inline-block hover:underline">
            Privacy
          </Link>
          <Link href="/terms" className="inline-block hover:underline">
            Terms
          </Link>
        </div>
      </footer>
    </section>
  );
};
