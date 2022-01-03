import { MetaFunction } from "remix";
import { createMeta } from "~/lib/core/util/meta";
import { AuthForm } from "~/lib/auth/ui/AuthForm";

export let meta: MetaFunction = () => {
  return createMeta({
    title: "Confirm Password Reset",
  });
};

const Page = () => {
  return (
    <main className="w-full max-w-md mx-auto mt-5">
      <hgroup className="text-center">
        <h1 className="text-2xl font-bold">Confirm Password Reset</h1>
        <h2 className="mt-1 mb-5 text-slate-500 dark:text-slate-300">
          Set your new password
        </h2>
      </hgroup>
      <div className="p-8 bg-white rounded-lg shadow-md dark:bg-slate-900">
        <AuthForm authType="confirm" submitButtonText="Reset Password" />
      </div>
    </main>
  );
};

export default Page;
