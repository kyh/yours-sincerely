import type { ActionFunction, MetaFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { badRequest } from "remix-utils";
import type { AuthInput } from "~/lib/auth/data/authSchema";
import { isPasswordValid } from "~/lib/auth/data/authSchema";
import { setUserSessionAndCommit } from "~/lib/auth/server/authenticator.server";
import { validateToken } from "~/lib/auth/server/authService.server";
import { AuthForm } from "~/lib/auth/ui/AuthForm";
import { createMeta } from "~/lib/core/util/meta";
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

  if (!isPasswordValid(password)) {
    return badRequest({ message: "Password must be at least 5 characters" });
  }

  const updated = await updateUser({ id: validated.id, password });
  const headers = await setUserSessionAndCommit(request, updated.id);

  return redirect(redirectTo || "/", { headers });
};

const Page = () => {
  return (
    <main className="mx-auto mt-5 w-full max-w-md">
      <hgroup className="text-center">
        <h1 className="text-2xl font-bold">Confirm Password Reset</h1>
        <h2 className="mt-1 mb-5 text-slate-500 dark:text-slate-300">
          Set your new password
        </h2>
      </hgroup>
      <div className="rounded-lg bg-white p-8 shadow-md dark:bg-slate-900">
        <AuthForm authType="confirm" />
      </div>
    </main>
  );
};

export default Page;
