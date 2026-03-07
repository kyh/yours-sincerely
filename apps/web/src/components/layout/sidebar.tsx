"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  useAuthenticatedKnockClient,
  useNotifications,
  useNotificationStore,
} from "@knocklabs/react";
import { Button } from "@repo/ui/button";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useIconAnimation } from "@/components/animations/use-icon-animation";
import { useTRPC } from "@/trpc/react";

const LottiePlayer = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((mod) => mod.Player),
  {
    ssr: false,
  },
);

export const Sidebar = () => {
  const trpc = useTRPC();
  const {
    data: { user },
  } = useSuspenseQuery(trpc.auth.workspace.queryOptions());

  const knock = useAuthenticatedKnockClient(
    process.env.NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY!,
    user?.id,
  );
  const notificationFeed = useNotifications(
    knock,
    process.env.NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID!,
  );
  const { metadata } = useNotificationStore(notificationFeed);

  const iconClassName = "size-6 dark:invert dark-purple:invert";
  const { setDotLottie: homeSetDotLottie, ...homeControlProps } =
    useIconAnimation();
  const { setDotLottie: bellSetDotLottie, ...bellControlProps } =
    useIconAnimation();
  const { setDotLottie: userSetDotLottie, ...userControlProps } =
    useIconAnimation();

  useEffect(() => {
    void notificationFeed.fetch();
  }, [notificationFeed]);

  return (
    <section className="area-nav">
      <nav className="bg-background flex w-full items-start justify-around gap-1 px-2 pb-2 md:-ml-4 md:w-auto md:flex-col md:px-0 md:py-5">
        <Button variant="ghost" {...homeControlProps} asChild>
          <Link href="/">
            <LottiePlayer
              src="/icons/home-icon.json"
              className={iconClassName}
              aria-hidden="true"
              lottieRef={homeSetDotLottie}
            />
            <span className="sr-only md:not-sr-only">Home</span>
          </Link>
        </Button>
        <Button variant="ghost" {...bellControlProps} asChild>
          <Link href="/notifications">
            <span className="relative">
              <LottiePlayer
                src="/icons/bell-icon.json"
                className={iconClassName}
                aria-hidden="true"
                lottieRef={bellSetDotLottie}
              />
              {metadata.unread_count > 0 && (
                <span className="bg-destructive animate-in fade-in zoom-in absolute -top-0.5 -right-0.5 size-1.5 rounded-full" />
              )}
            </span>
            <span className="sr-only md:not-sr-only">Notifications</span>
          </Link>
        </Button>
        <Button variant="ghost" {...userControlProps} asChild>
          <Link href={user ? `/profile/${user.id}` : `/auth/sign-up`}>
            <LottiePlayer
              src="/icons/user-icon.json"
              className={iconClassName}
              aria-hidden="true"
              lottieRef={userSetDotLottie}
            />
            <span className="sr-only md:not-sr-only">Profile</span>
          </Link>
        </Button>
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
