import type { Metadata } from "next";
import Link from "next/link";

import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { safeNextPath } from "@repo/contracts/navigation";

import { AuthForm } from "../_components/auth-form";

export const metadata: Metadata = {
  title: "Sign Up",
};

type Props = { searchParams: Promise<{ next?: string | string[] }> };

const Page = async ({ searchParams }: Props) => {
  const { next } = await searchParams;

  return (
    <>
      <PageHeader title="Sign up" />
      <PageContent className="flex flex-col gap-5">
        <AuthForm type="signup" className="mt-2" nextPath={safeNextPath(next)} />
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
