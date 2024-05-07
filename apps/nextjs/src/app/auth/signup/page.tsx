// "use server";

import Link from "next/link";

import { Divider } from "@/app/_components/divider";
import { AuthForm } from "@/components/auth/auth-form";
import { SocialLoginForm } from "@/components/auth/social-login-form";
import { PageContent, PageHeader } from "@/components/layout/page-layout";

const Page = () => {
  return (
    <>
      <PageHeader title="Sign up" />
      <PageContent>
        <div className="rounded-lg bg-white p-8 shadow-md dark:bg-slate-900">
          <AuthForm authType="signup" />
          <Divider bgColor="bg-white dark:bg-slate-900">
            Or continue with
          </Divider>
          <SocialLoginForm />
        </div>
        <div className="mt-2 flex justify-between">
          <Link
            className="text-sm text-slate-500 dark:text-slate-300"
            href="/auth/login"
          >
            Already have an account?
          </Link>
        </div>
      </PageContent>
    </>
  );
};

export default Page;
