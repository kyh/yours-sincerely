"use client";

import Link from "next/link";
import { Logo } from "@repo/ui/components/logo";

import type { ErrorProps } from "./(app)/error";
import AppError from "./(app)/error";

// Only reached when the (app) layout itself failed, most likely on the identity
// query its chrome reads. So no Sidebar or AsideHeader here: they read that
// same query and would throw again inside the fallback.
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
