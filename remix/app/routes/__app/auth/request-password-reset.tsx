import { AuthForm } from "~/lib/auth/ui/AuthForm";

const Page = () => {
  return (
    <main className="w-full max-w-md mx-auto mt-5">
      <hgroup className="text-center">
        <h1 className="text-2xl font-bold">Request Password Reset</h1>
        <h2 className="mt-1 mb-5 text-slate-500">Forgot your password?</h2>
      </hgroup>
      <div className="bg-white p-8 shadow-md rounded-lg">
        <AuthForm
          authType="request"
          submitButtonText="Request Password Reset"
        />
      </div>
    </main>
  );
};

export default Page;
