"use client";

import { useEffect } from "react";
import { Button } from "@repo/ui/components/button";

import type { ErrorProps } from "./(app)/error";

import "./styles/globals.css";

// Replaces the root layout, so none of its providers exist here: no theme, no
// query client. Keep this free of anything that needs them.
const GlobalError = ({ error, retry }: ErrorProps) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground font-sans antialiased">
        <title>Something went wrong</title>
        <main className="mx-auto flex max-w-md flex-col gap-5 px-5 py-16">
          <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
          <p>
            Please try again, or ping me on{" "}
            <a className="font-semibold underline" href="https://x.com/kaiyuhsu">
              X
            </a>{" "}
            if it persists.
          </p>
          <Button type="button" className="self-start" onClick={retry}>
            Try again
          </Button>
        </main>
      </body>
    </html>
  );
};

export default GlobalError;
