import type { ActionFunction, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import { createMeta } from "~/lib/core/util/meta";
import { sendEmail } from "~/lib/core/server/email.server";
import { AuthForm } from "~/lib/auth/ui/AuthForm";
import type { AuthInput } from "~/lib/auth/data/authSchema";
import { createToken } from "~/lib/auth/server/authService.server";
import { getUser } from "~/lib/user/server/userService.server";

export let meta: MetaFunction = () => {
  return createMeta({
    title: "Request Password Reset",
  });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const { email } = Object.fromEntries(formData) as AuthInput;

  const user = await getUser({ email });

  if (!user) {
    // No user found but we don't want to leak any emails
    return json({ success: true });
  }

  const token = await createToken("RESET_PASSWORD", {
    sentTo: email,
    user: {
      connect: {
        id: user.id,
      },
    },
  });

  await sendEmail({
    to: email,
    templateAlias: "reset-password",
    templateModel: {
      action_url: `${process.env.APP_URL}/auth/confirm-password-reset?token=${token.token}`,
    },
  });

  return json({ success: true });
};

const Page = () => {
  const action = useActionData();

  return (
    <main className="mx-auto mt-5 w-full max-w-md">
      <hgroup className="text-center">
        <h1 className="text-2xl font-bold">Request Password Reset</h1>
        <h2 className="mt-1 mb-5 text-slate-500 dark:text-slate-300">
          Want to change your password?
        </h2>
      </hgroup>
      <div className="rounded-lg bg-white p-8 shadow-md dark:bg-slate-900">
        {action && action.success ? (
          <p className="text-center">
            We've sent a password reset link to your email.
          </p>
        ) : (
          <AuthForm authType="request" />
        )}
      </div>
    </main>
  );
};

export default Page;
