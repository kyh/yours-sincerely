import type { Metadata } from "next";
import Link from "next/link";

import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { AuthForm } from "../_components/auth-form";

export const metadata: Metadata = {
  title: "Welcome back",
};

const Page = () => {
  return (
    <>
      <PageHeader title="Welcome back" />
      <PageContent className="flex flex-col gap-5">
        <AuthForm type="signin" className="mt-2" />
        <p className="px-8 text-center text-xs text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href="/auth/sign-up"
            className="underline underline-offset-4 transition hover:text-primary"
          >
            Sign up
          </Link>
        </p>
      </PageContent>
    </>
  );
};

export default Page;
