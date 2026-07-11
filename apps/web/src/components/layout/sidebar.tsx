"use client";

import { useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  useAuthenticatedKnockClient,
  useNotifications,
  useNotificationStore,
} from "@knocklabs/react";
import { useQueryClient } from "@tanstack/react-query";
import { buttonVariants } from "@repo/ui/components/button";

import { useWorkspace } from "@/lib/use-workspace-user";
import { useTRPC } from "@/trpc/react";

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
  const { user, knockUserToken } = useWorkspace();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const refreshUserToken = useCallback(async () => {
    const { token } = await queryClient.fetchQuery({
      ...trpc.auth.knockUserToken.queryOptions(),
      staleTime: 0,
    });
    return token ?? undefined;
  }, [queryClient, trpc.auth.knockUserToken]);

  const knock = useAuthenticatedKnockClient(
    process.env.NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY ?? "",
    user?.id,
    knockUserToken ?? undefined,
    { onUserTokenExpiring: refreshUserToken },
  );
  const notificationFeed = useNotifications(
    knock,
    process.env.NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID ?? "",
  );
  const { metadata } = useNotificationStore(notificationFeed);

  const iconClassName = "size-6 dark:invert dark-purple:invert";
  const { setDotLottie: homeSetDotLottie, ...homeControlProps } = useIconAnimation();
  const { setDotLottie: bellSetDotLottie, ...bellControlProps } = useIconAnimation();
  const { setDotLottie: userSetDotLottie, ...userControlProps } = useIconAnimation();

  useEffect(() => {
    void notificationFeed.fetch();
  }, [notificationFeed]);

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
            {metadata.unread_count > 0 && (
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
