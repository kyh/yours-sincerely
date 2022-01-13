import { MetaFunction, ActionFunction, redirect } from "remix";
import { badRequest } from "remix-utils";
import { createMeta } from "~/lib/core/util/meta";
import { AuthForm } from "~/lib/auth/ui/AuthForm";
import { AuthInput } from "~/lib/auth/data/authSchema";
import { attachUserSession } from "~/lib/auth/server/authenticator.server";
import { validateToken } from "~/lib/auth/server/authService.server";
import { updateUser } from "~/lib/user/server/userService.server";

export let meta: MetaFunction = () => {
  return createMeta({
    title: "Confirm Password Reset",
  });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const { redirectTo, token, password } = Object.fromEntries(
    formData
  ) as AuthInput;

  const validated = await validateToken("RESET_PASSWORD", token);

  if (!validated) {
    return badRequest({ message: "Invalid token" });
  }

  const updated = await updateUser({ id: validated.id, password });
  const headers = await attachUserSession(request, updated.id);

  return redirect(redirectTo || "/", { headers });
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
        <AuthForm authType="confirm" />
      </div>
    </main>
  );
};

export default Page;
