import Link from "next/link";
import { Button } from "@init/ui/button";

import type { RouterOutputs } from "@init/api";
import { HomeIcon } from "@/components/icons/home-icon";
import { NotificationIcon } from "@/components/icons/notification-icon";
import { ProfileIcon } from "@/components/icons/profile-icon";

type Props = {
  user: RouterOutputs["account"]["me"];
};

export const Sidebar = ({ user }: Props) => {
  return (
    <section className="area-nav flex flex-col">
      <nav className="-ml-4 flex flex-col items-start gap-1 py-5">
        <Button variant="ghost" asChild>
          <Link href="/">
            <HomeIcon aria-hidden="true" className="h-5 w-5" />
            <span className="truncate">Home</span>
          </Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/notifications">
            <NotificationIcon aria-hidden="true" className="h-5 w-5" />
            <span className="truncate">Notifications</span>
          </Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href={user ? `/profile/${user.id}` : `/auth/sign-up`}>
            <ProfileIcon aria-hidden="true" className="h-5 w-5" />
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
