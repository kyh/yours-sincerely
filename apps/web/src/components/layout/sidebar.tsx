"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { buttonVariants } from "@repo/ui/components/button";
import { useQuery } from "@tanstack/react-query";

import { useWorkspaceUser } from "@/lib/use-workspace-user";
import { orpc } from "@/orpc/react";

const LottiePlayer = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((mod) => mod.Player),
  {
    ssr: false,
  },
);

type DotLottie = { play: () => void };

const useIconAnimation = () => {
  const dotLottieRef = useRef<DotLottie>(null);
  return {
    setDotLottie: (dotLottie: DotLottie) => {
      dotLottieRef.current = dotLottie;
    },
    onMouseEnter: () => dotLottieRef.current?.play(),
    onTouchStart: () => dotLottieRef.current?.play(),
  };
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

  const iconClassName = "size-6 dark:invert dark-purple:invert";
  const { setDotLottie: homeSetDotLottie, ...homeControlProps } = useIconAnimation();
  const { setDotLottie: bellSetDotLottie, ...bellControlProps } = useIconAnimation();
  const { setDotLottie: userSetDotLottie, ...userControlProps } = useIconAnimation();

  return (
    <section className="area-nav">
      <nav className="bg-background flex w-full items-start justify-around gap-1 px-2 pb-2 md:-ml-4 md:w-auto md:flex-col md:px-0 md:py-5">
        <Link href="/" className={buttonVariants({ variant: "ghost" })} {...homeControlProps}>
          <LottiePlayer
            src="/icons/home-icon.json"
            className={iconClassName}
            aria-hidden="true"
            lottieRef={homeSetDotLottie}
          />
          <span className="sr-only md:not-sr-only">Home</span>
        </Link>
        <Link
          href="/notifications"
          className={buttonVariants({ variant: "ghost" })}
          {...bellControlProps}
        >
          <span className="relative">
            <LottiePlayer
              src="/icons/bell-icon.json"
              className={iconClassName}
              aria-hidden="true"
              lottieRef={bellSetDotLottie}
            />
            {unreadCount > 0 && (
              <span className="bg-destructive animate-in fade-in zoom-in absolute -top-0.5 -right-0.5 size-1.5 rounded-full" />
            )}
          </span>
          <span className="sr-only md:not-sr-only">Notifications</span>
        </Link>
        <Link
          href={user ? `/profile/${user.id}` : `/auth/sign-up`}
          className={buttonVariants({ variant: "ghost" })}
          {...userControlProps}
        >
          <LottiePlayer
            src="/icons/user-icon.json"
            className={iconClassName}
            aria-hidden="true"
            lottieRef={userSetDotLottie}
          />
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
