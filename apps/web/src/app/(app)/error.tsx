"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@repo/ui/components/button";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";

import { PageContent, PageHeader } from "@/components/layout/page-layout";

export interface ErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

const Page = ({ error, retry }: ErrorProps) => {
  const { reset } = useQueryErrorResetBoundary();

  useEffect(() => {
    console.error(error);
  }, [error]);

  // `retry` alone re-renders the segment, but a suspense query that already
  // failed is not refetched on remount until TanStack's boundary is reset too.
  const tryAgain = () => {
    reset();
    retry();
  };

  return (
    <>
      <PageHeader title="Page Error" />
      <PageContent className="flex flex-col gap-5">
        <p>
          Looks like you ran into an error, please ping me on{" "}
          <a className="font-semibold underline" href="https://x.com/kaiyuhsu">
            X
          </a>{" "}
          if it persists.
        </p>
        <div className="flex gap-2">
          <Button type="button" onClick={tryAgain}>
            Try again
          </Button>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Return Home
          </Link>
        </div>
      </PageContent>
    </>
  );
};

export default Page;
