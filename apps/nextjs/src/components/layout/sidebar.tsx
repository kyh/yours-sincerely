"use client";

import Link from "next/link";
import { Button } from "@init/ui/button";

import { BellIcon } from "@/components/icons/bell-icon";
import { HomeIcon } from "@/components/icons/home-icon";
import { UserIcon } from "@/components/icons/user-icon";
import { useIconAnimation } from "@/lib/animation";
import { api } from "@/trpc/react";

export const Sidebar = () => {
  const [{ user }] = api.auth.workspace.useSuspenseQuery();

  const { controls: homeControls, ...homeControlProps } = useIconAnimation();
  const { controls: bellControls, ...bellControlProps } = useIconAnimation();
  const { controls: userControls, ...userControlProps } = useIconAnimation();

  return (
    <section className="area-nav">
      <nav className="flex w-full items-start justify-around gap-1 bg-background px-2 py-2 md:-ml-4 md:w-auto md:flex-col md:px-0 md:py-5">
        <Button variant="ghost" {...homeControlProps} asChild>
          <Link href="/">
            <HomeIcon
              aria-hidden="true"
              controls={homeControls}
              className="size-5"
            />
            Home
          </Link>
        </Button>
        <Button variant="ghost" {...bellControlProps} asChild>
          <Link href="/notifications">
            <BellIcon
              aria-hidden="true"
              controls={bellControls}
              className="size-5"
            />
            Notifications
          </Link>
        </Button>
        <Button variant="ghost" {...userControlProps} asChild>
          <Link href={user ? `/profile/${user.id}` : `/auth/sign-up`}>
            <UserIcon
              aria-hidden="true"
              controls={userControls}
              className="size-5"
            />
            Profile
          </Link>
        </Button>
      </nav>
      <footer className="mt-auto hidden flex-col gap-2 border-t border-t-border py-4 text-xs md:flex">
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
