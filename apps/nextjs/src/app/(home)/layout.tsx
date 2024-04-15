import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { Button, buttonVariants } from "@init/ui/button";
import { Logo } from "@init/ui/logo";
import { cn } from "@init/ui/utils";
import {
  BellIcon,
  BookmarkIcon,
  Component1Icon,
  HomeIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import type { User } from "@supabase/auth-helpers-nextjs";

export const metadata: Metadata = {
  title: "Init",
  description: "Unauthenticated pages",
};

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const supabase = createServerComponentClient({
    cookies,
  });

  const { data } = await supabase.auth.getUser();

  return (
    <section className="page-layout mx-auto min-h-dvh max-w-3xl px-5 lg:max-w-screen-xl">
      <NavHeader />
      <NavSidebar />
      {children}
      <AsideHeader />
    </section>
  );
};

export default Layout;

const NavHeader = () => (
  <div className="area-nav-header hidden items-center border-b border-b-gray-400 lg:flex">
    <Logo />
  </div>
);

const navigation = [
  { name: "Home", href: "/home", icon: HomeIcon, current: true },
  { name: "Explore", href: "/explore", icon: Component1Icon, current: false },
  { name: "Bookmark", href: "/bookmark", icon: BookmarkIcon, current: false },
];

const footerNavigation = [
  { name: "About", href: "/about" },
  { name: "Privacy", href: "/privacy" },
  { name: "Terms", href: "/terms" },
];

const NavSidebar = () => {
  return (
    <section className="area-nav hidden flex-col lg:flex">
      <nav className="flex flex-col py-6">
        {navigation.map((item) => (
          <div className="-mx-4 my-1" key={item.name}>
            <Link
              href={item.href}
              className={buttonVariants({
                variant: "ghost",
              })}
            >
              <item.icon aria-hidden="true" className="mr-4 h-5 w-5" />
              <span className="truncate">{item.name}</span>
            </Link>
          </div>
        ))}
      </nav>
      <footer className="mt-auto border-t border-t-gray-400 py-4 text-xs">
        <div className="mb-1">
          ©{new Date().getFullYear()}, Made with{" "}
          <a
            className="hover:underline"
            href="https://github.com/kyh/inteligir"
            target="_blank"
            rel="noreferrer"
          >
            💻
          </a>
        </div>
        <div>
          {footerNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="mr-1 inline-block hover:underline"
            >
              {item.name}
            </Link>
          ))}
        </div>
      </footer>
    </section>
  );
};

const AsideHeader = () => (
  <div className="area-aside-header hidden items-center justify-end space-x-4 border-b border-b-gray-400 xl:flex">
    <Button variant="ghost">
      <span className="sr-only">Search</span>
      <MagnifyingGlassIcon className="h-6 w-6" aria-hidden="true" />
    </Button>
    <Button variant="ghost">
      <span className="sr-only">View notifications</span>
      <BellIcon className="h-6 w-6" aria-hidden="true" />
    </Button>
  </div>
);
