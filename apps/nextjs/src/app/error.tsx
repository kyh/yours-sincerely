"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@kyh/ui/button";
import { Logo } from "@kyh/ui/logo";

import { AsideHeader } from "@/components/layout/aside-header";
import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { Sidebar } from "@/components/layout/sidebar";

type ErrorProps = {
  error: Error;
};

const Page = ({ error }: ErrorProps) => {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <section className="page-layout">
      <div className="area-nav-header">
        <Link href="/">
          <Logo />
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
        <Button className="self-start" variant="outline" asChild>
          <Link href="/">Return Home</Link>
        </Button>
      </PageContent>
      <AsideHeader />
    </section>
  );
};

export default Page;
