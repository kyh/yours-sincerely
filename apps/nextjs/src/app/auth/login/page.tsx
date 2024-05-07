// "use server";

import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { SocialLoginForm } from "@/components/auth/social-login-form";
import { PageContent, PageHeader } from "@/components/layout/page-layout";

const Page = () => {
  return (
    <>
      <PageHeader title="Welcome Back" />
      <PageContent>
        <div className="rounded-lg bg-white p-8 shadow-md dark:bg-slate-900">
          <AuthForm authType="login" />
          <SocialLoginForm />
        </div>
        <div className="mt-2 flex justify-between">
          <Link
            className="text-sm text-slate-500 dark:text-slate-300"
            href="/auth/signup"
          >
            Don't have an account?
          </Link>
        </div>
      </PageContent>
    </>
  );
};

export default Page;
