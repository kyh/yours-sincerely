import type { Metadata } from "next";
import Link from "next/link";

import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { AuthForm } from "../_components/auth-form";

export const metadata: Metadata = {
  title: "Sign Up",
};

const Page = () => {
  return (
    <>
      <PageHeader title="Sign up" />
      <PageContent className="flex flex-col gap-5">
        <AuthForm type="signup" className="mt-2" />
        <p className="px-8 text-center text-xs text-muted-foreground">
          By clicking continue, you agree to our{" "}
          <Link
            href="/terms"
            className="underline underline-offset-4 transition hover:text-primary"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-4 transition hover:text-primary"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </PageContent>
    </>
  );
};

export default Page;
