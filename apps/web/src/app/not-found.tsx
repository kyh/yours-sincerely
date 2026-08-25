import Link from "next/link";
import { buttonVariants } from "@repo/ui/components/button";
import { Logo } from "@repo/ui/components/logo";

import { AsideHeader } from "@/components/layout/aside-header";
import { PageContent, PageHeader } from "@/components/layout/page-layout";
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
        <PageHeader title="Page not found" />
        <PageContent className="flex flex-col gap-5">
          <h1>Could not find the page you were looking for</h1>
          <Link
            href="/"
            className={buttonVariants({ variant: "outline", className: "self-start" })}
          >
            Return Home
          </Link>
        </PageContent>
        <AsideHeader />
      </section>
    </HydrateClient>
  );
};

export default Page;
