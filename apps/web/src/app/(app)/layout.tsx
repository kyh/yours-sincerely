import Link from "next/link";
import { Logo } from "@repo/ui/components/logo";

import { CardStackProvider } from "@/app/(app)/posts/_components/card-stack";
import { AsideHeader } from "@/components/layout/aside-header";
import { Sidebar } from "@/components/layout/sidebar";
import { HydrateClient, prefetch, orpc } from "@/orpc/server";

export const dynamic = "force-dynamic";

const Layout = ({ children }: { children: React.ReactNode }) => {
  prefetch(orpc.auth.workspace.queryOptions());

  return (
    <HydrateClient>
      <CardStackProvider>
        <section className="page-layout">
          <div className="area-nav-header">
            <Link href="/" aria-label="Yours Sincerely home">
              <Logo aria-hidden="true" />
            </Link>
          </div>
          <Sidebar />
          {children}
          <AsideHeader />
        </section>
      </CardStackProvider>
    </HydrateClient>
  );
};

export default Layout;
