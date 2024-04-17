// "use server";

import Link from "next/link";

import { Divider } from "@/app/_components/divider";
import { PageHeader } from "@/components/page-header";
import { AuthForm } from "@/lib/auth/ui/authform";
import { SocialLoginForm } from "@/lib/auth/ui/socialloginform";

const Page = () => {
  return (
    <>
      <PageHeader title="Welcome Back" />
      <main className="mx-auto w-full max-w-md">
        <div className="rounded-lg bg-white p-8 shadow-md dark:bg-slate-900">
          <AuthForm authType="login" />
          <Divider bgColor="bg-white dark:bg-slate-900">
            Or continue with
          </Divider>
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
      </main>
    </>
  );
};

export default Page;
