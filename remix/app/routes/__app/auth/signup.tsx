import { Link } from "remix";
import { AuthForm } from "~/lib/auth/ui/AuthForm";
import { SocialLoginForm } from "~/lib/auth/ui/SocialLoginForm";
import { Divide } from "~/lib/core/ui/Divide";

const Page = () => {
  return (
    <main className="w-full max-w-md mx-auto">
      <hgroup className="text-center">
        <h1 className="text-2xl font-bold">Sign Up</h1>
        <h2 className="mt-1 mb-5 text-slate-500">
          Start writing something, anything
        </h2>
      </hgroup>
      <div className="bg-white p-8 shadow-md rounded-lg">
        <AuthForm authType="signup" submitButtonText="Sign up" />
        <Divide bgColor="bg-white">Or continue with</Divide>
        <SocialLoginForm />
      </div>
      <div className="flex justify-between mt-2">
        <Link className="text-slate-500 text-sm" to="/auth/login">
          Already have an account?
        </Link>
      </div>
    </main>
  );
};

export default Page;
