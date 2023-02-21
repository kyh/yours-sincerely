import type { ActionFunction, MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { badRequest, serverError } from "remix-utils";
import { Divider } from "~/components/Divider";
import {
  authenticator,
  AuthorizationError,
} from "~/lib/auth/server/authenticator.server";
import { AuthForm } from "~/lib/auth/ui/AuthForm";
import { SocialLoginForm } from "~/lib/auth/ui/SocialLoginForm";
import { createMeta } from "~/lib/core/util/meta";

export let meta: MetaFunction = () => {
  return createMeta({
    title: "Login",
  });
};

export const action: ActionFunction = async ({ request }) => {
  try {
    return await authenticator.authenticate("login", request, {
      successRedirect: "/",
    });
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof AuthorizationError)
      return badRequest({ message: error.message });
    return serverError(error);
  }
};

const Page = () => {
  return (
    <main className="mx-auto w-full max-w-md">
      <hgroup className="text-center">
        <h1 className="text-2xl font-bold">Log back in</h1>
        <h2 className="mt-1 mb-5 text-slate-500 dark:text-slate-300">
          Welcome back
        </h2>
      </hgroup>
      <div className="rounded-lg bg-white p-8 shadow-md dark:bg-slate-900">
        <AuthForm authType="login" />
        <Divider bgColor="bg-white dark:bg-slate-900">Or continue with</Divider>
        <SocialLoginForm />
      </div>
      <div className="mt-2 flex justify-between">
        <Link
          className="text-sm text-slate-500 dark:text-slate-300"
          to="/auth/signup"
        >
          Don't have an account?
        </Link>
      </div>
    </main>
  );
};

export default Page;
