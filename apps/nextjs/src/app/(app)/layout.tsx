import Link from "next/link";
import { Logo } from "@init/ui/logo";

import { AsideHeader } from "@/components/layout/aside-header";
import { Sidebar } from "@/components/layout/sidebar";
import { api, HydrateClient } from "@/trpc/server";

export const dynamic = "force-dynamic";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  await api.auth.workspace.prefetch();

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
