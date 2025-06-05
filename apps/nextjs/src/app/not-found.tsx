import Link from "next/link";
import { Button } from "@repo/ui/button";
import { Logo } from "@repo/ui/logo";

import { AsideHeader } from "@/components/layout/aside-header";
import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { Sidebar } from "@/components/layout/sidebar";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const dynamic = "force-dynamic";

const Page = () => {
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
        <PageHeader title="Page not found" />
        <PageContent className="flex flex-col gap-5">
          <h1>Could not find the page you were looking for</h1>
          <Button className="self-start" variant="outline" asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </PageContent>
        <AsideHeader />
      </section>
    </HydrateClient>
  );
};

export default Page;
