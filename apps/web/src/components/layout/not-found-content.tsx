import Link from "next/link";
import { buttonVariants } from "@repo/ui/components/button";

import { PageContent, PageHeader } from "@/components/layout/page-layout";

export const NotFoundContent = () => (
  <>
    <PageHeader title="Page not found" />
    <PageContent className="flex flex-col gap-5">
      <h1>Could not find the page you were looking for</h1>
      <Link href="/" className={buttonVariants({ className: "self-start", variant: "outline" })}>
        Return Home
      </Link>
    </PageContent>
  </>
);
