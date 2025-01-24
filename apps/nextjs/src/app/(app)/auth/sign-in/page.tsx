import Link from "next/link";

import { AuthForm } from "@/app/(app)/auth/_components/auth-form";
import { PageContent, PageHeader } from "@/components/layout/page-layout";

export const generateMetadata = () => {
  return {
    title: "Sign In",
  };
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
