"use client";

import { useEffect } from "react";
import Link from "next/link";
import { buttonVariants } from "@repo/ui/components/button";
import { Logo } from "@repo/ui/components/logo";

import { AsideHeader } from "@/components/layout/aside-header";
import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { Sidebar } from "@/components/layout/sidebar";

interface ErrorProps {
  error: Error;
}

const Page = ({ error }: ErrorProps) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="page-layout">
      <div className="area-nav-header">
        <Link href="/" aria-label="Yours Sincerely home">
          <Logo aria-hidden="true" />
        </Link>
      </div>
      <Sidebar />
      <PageHeader title="Page Error" />
      <PageContent className="flex flex-col gap-5">
        <h1>
          Looks like you ran into an error, please ping me on{" "}
          <a className="font-semibold underline" href="https://x.com/kaiyuhsu">
            X
          </a>{" "}
          if it persists.
        </h1>
        <Link href="/" className={buttonVariants({ className: "self-start", variant: "outline" })}>
          Return Home
        </Link>
      </PageContent>
      <AsideHeader />
    </section>
  );
};

export default Page;
