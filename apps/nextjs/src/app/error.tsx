"use client";

import { useEffect } from "react";
import { Button } from "@init/ui/button";

import { PageContent, PageHeader } from "@/components/layout/page-layout";

type ErrorProps = {
  error: Error;
};

const Error = ({ error }: ErrorProps) => {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex max-w-md flex-col px-5">
      <PageHeader title="Error" className="h-16" />
      <PageContent className="flex flex-col gap-5">
        <h1>
          Looks like you ran into an error, please ping me on{" "}
          <a className="font-semibold underline" href="https://x.com/kaiyuhsu">
            X
          </a>{" "}
          if it persists.
        </h1>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </PageContent>
    </section>
  );
};

export default Error;
