import Link from "next/link";
import { Logo } from "@repo/ui/components/logo";

import { AsideHeader } from "@/components/layout/aside-header";
import { NotFoundContent } from "@/components/layout/not-found-content";
import { Sidebar } from "@/components/layout/sidebar";
import { HydrateClient, prefetch, orpc } from "@/orpc/server";

export const dynamic = "force-dynamic";

const Page = () => {
  prefetch(orpc.auth.workspace.queryOptions());

  return (
    <HydrateClient>
      <section className="page-layout">
        <div className="area-nav-header">
          <Link href="/" aria-label="Yours Sincerely home">
            <Logo aria-hidden="true" />
          </Link>
        </div>
        <Sidebar />
        <NotFoundContent />
        <AsideHeader />
      </section>
    </HydrateClient>
  );
};

export default Page;
