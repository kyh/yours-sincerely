import type { Metadata } from "next";
import Link from "next/link";

import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { RequestPasswordResetForm } from "../_components/auth-form";

export const metadata: Metadata = {
  title: "Request Password Reset",
};

const Page = () => (
  <>
    <PageHeader title="Request password reset" />
    <PageContent className="flex flex-col gap-5">
      <RequestPasswordResetForm />
      <p className="px-8 text-center text-xs text-muted-foreground">
        Back to{" "}
        <Link
          href="/auth/sign-in"
          className="underline underline-offset-4 transition hover:text-primary"
        >
          Sign in
        </Link>
      </p>
    </PageContent>
  </>
);

export default Page;
