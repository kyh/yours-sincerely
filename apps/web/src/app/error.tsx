"use client";

import Link from "next/link";
import { Logo } from "@repo/ui/components/logo";

import type { ErrorProps } from "./(app)/error";
import AppError from "./(app)/error";

const Page = (props: ErrorProps) => (
  <section className="page-layout">
    <div className="area-nav-header">
      <Link href="/" aria-label="Yours Sincerely home">
        <Logo aria-hidden="true" />
      </Link>
    </div>
    <AppError {...props} />
  </section>
);

export default Page;
