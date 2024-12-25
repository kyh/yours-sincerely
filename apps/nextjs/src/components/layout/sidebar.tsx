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
    <section className="area-nav flex flex-col">
      <nav className="-ml-4 flex flex-col items-start gap-1 py-5">
        <Button variant="ghost" {...homeControlProps} asChild>
          <Link href="/">
            <HomeIcon
              aria-hidden="true"
              controls={homeControls}
              className="size-5"
            />
            <span className="truncate">Home</span>
          </Link>
        </Button>
        <Button variant="ghost" {...bellControlProps} asChild>
          <Link href="/notifications">
            <BellIcon
              aria-hidden="true"
              controls={bellControls}
              className="size-5"
            />
            <span className="truncate">Notifications</span>
          </Link>
        </Button>
        <Button variant="ghost" {...userControlProps} asChild>
          <Link href={user ? `/profile/${user.id}` : `/auth/sign-up`}>
            <UserIcon
              aria-hidden="true"
              controls={userControls}
              className="size-5"
            />
            <span className="truncate">Profile</span>
          </Link>
        </Button>
      </nav>
      <footer className="mt-auto flex flex-col gap-2 border-t border-t-border py-4 text-xs">
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
