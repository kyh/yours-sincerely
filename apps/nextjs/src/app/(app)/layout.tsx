import Link from "next/link";
import { Logo } from "@repo/ui/logo";

import { AsideHeader } from "@/components/layout/aside-header";
import { Sidebar } from "@/components/layout/sidebar";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const dynamic = "force-dynamic";

const Layout = ({ children }: { children: React.ReactNode }) => {
  prefetch(trpc.auth.workspace.queryOptions());

  return (
    <HydrateClient>
      <section className="page-layout">
        <div className="area-nav-header">
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
