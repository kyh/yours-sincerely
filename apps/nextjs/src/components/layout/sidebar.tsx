"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@init/ui/button";
import {
  useAuthenticatedKnockClient,
  useNotifications,
  useNotificationStore,
} from "@knocklabs/react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { BellIcon } from "@/components/icons/bell-icon";
import { HomeIcon } from "@/components/icons/home-icon";
import { UserIcon } from "@/components/icons/user-icon";
import { useIconAnimation } from "@/lib/animation";
import { useTRPC } from "@/trpc/react";

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

  const { controls: homeControls, ...homeControlProps } = useIconAnimation();
  const { controls: bellControls, ...bellControlProps } = useIconAnimation();
  const { controls: userControls, ...userControlProps } = useIconAnimation();

  useEffect(() => {
    notificationFeed.fetch();
  }, [notificationFeed]);

  return (
    <section className="area-nav">
      <nav className="bg-background flex w-full items-start justify-around gap-1 px-2 pb-2 md:-ml-4 md:w-auto md:flex-col md:px-0 md:py-5">
        <Button variant="ghost" {...homeControlProps} asChild>
          <Link href="/">
            <HomeIcon
              aria-hidden="true"
              controls={homeControls}
              className="size-5"
            />
            <span className="sr-only md:not-sr-only">Home</span>
          </Link>
        </Button>
        <Button variant="ghost" {...bellControlProps} asChild>
          <Link href="/notifications">
            <span className="relative">
              <BellIcon
                aria-hidden="true"
                controls={bellControls}
                className="size-5"
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
            <UserIcon
              aria-hidden="true"
              controls={userControls}
              className="size-5"
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
