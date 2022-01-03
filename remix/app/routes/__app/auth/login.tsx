import { Link, ActionFunction } from "remix";
import { authenticate } from "~/lib/auth/server/middleware/auth.server";
import { AuthForm } from "~/lib/auth/ui/AuthForm";
import { SocialLoginForm } from "~/lib/auth/ui/SocialLoginForm";
import { Divider } from "~/lib/core/ui/Divider";

export const action: ActionFunction = async ({ request }) => {
  return authenticate("login", request, {
    successRedirect: "/",
    failureRedirect: "/auth/login",
  });
};

const Page = () => {
  return (
    <main className="w-full max-w-md mx-auto">
      <hgroup className="text-center">
        <h1 className="text-2xl font-bold">Log back in</h1>
        <h2 className="mt-1 mb-5 text-slate-500">Welcome back</h2>
      </hgroup>
      <div className="bg-white p-8 shadow-md rounded-lg">
        <AuthForm authType="login" submitButtonText="Log in" />
        <Divider bgColor="bg-white">Or continue with</Divider>
        <SocialLoginForm />
      </div>
      <div className="flex justify-between mt-2">
        <Link className="text-slate-500 text-sm" to="/auth/signup">
          Don't have an account?
        </Link>
      </div>
    </main>
  );
};

export default Page;
