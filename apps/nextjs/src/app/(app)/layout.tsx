import Link from "next/link";
import { Logo } from "@init/ui/logo";

import { AsideHeader } from "@/components/layout/aside-header";
import { Sidebar } from "@/components/layout/sidebar";
import { api, HydrateClient } from "@/trpc/server";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  await api.user.me.prefetch();

  return (
    <HydrateClient>
      <section className="page-layout mx-auto min-h-dvh max-w-3xl px-5 lg:max-w-screen-xl">
        <div className="area-nav-header flex items-center border-b border-b-border">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <Sidebar />
        {children}
        <AsideHeader />
      </section>
    </HydrateClient>
  );
};

export default Layout;
