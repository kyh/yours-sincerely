// "use server";

import Link from "next/link";

import { Divider } from "@/app/_components/Divider";
import Navbar from "@/app/_components/layout/Navbar";
import { AuthForm } from "@/lib/auth/ui/AuthForm";
import { SocialLoginForm } from "@/lib/auth/ui/SocialLoginForm";

const Page = () => {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-md">
        <hgroup className="text-center">
          <h1 className="text-2xl font-bold">Sign Up</h1>
          <h2 className="mb-5 mt-1 text-slate-500 dark:text-slate-300">
            Start writing something, anything
          </h2>
        </hgroup>
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
      </main>
    </>
  );
};

export default Page;
