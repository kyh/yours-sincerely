"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// import { isEmailValid, isPasswordValid } from "@init/api/lib/authschema";
// import { signIn } from "@init/auth";

import { Button } from "@init/ui/button";
import { Checkbox } from "@init/ui/checkbox";
import { toast } from "@init/ui/toast";

// import { api } from "@/trpc/server";

type Props = {
  authType: "signup" | "login" | "request" | "confirm";
};

const actionMap: Record<Props["authType"], { button: string; action: string }> =
  {
    signup: {
      action: "/auth/signup",
      button: "Sign up",
    },
    login: {
      action: "/auth/login",
      button: "Log in",
    },
    request: {
      action: "/auth/request-password-reset",
      button: "Request password reset",
    },
    confirm: {
      action: "/auth/confirm-password-reset",
      button: "Confirm password",
    },
  };

export const AuthForm = ({ authType }: Props) => {
  const { button, action } = actionMap[authType];
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const submitAuthForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      if (authType === "signup") {
        // await signUp(email, password);
      } else if (authType === "login") {
        // await signInWithPassword(email, password);
      }
      router.push("/");
    } catch (error) {
      toast.error((error as Error).message);
      setIsLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={submitAuthForm}>
      <input type="hidden" name="redirectTo" value={"/"} />
      <input type="hidden" name="token" value={""} />
      {authType !== "confirm" && (
        <input
          id="email"
          name="email"
          type="email"
          placeholder="your@mail.com"
          required
        />
      )}
      {authType !== "request" && (
        <input
          id="password"
          name="password"
          type="password"
          placeholder="********"
          required
        />
      )}
      {authType === "login" && (
        <div className="flex items-center justify-between">
          <label>
            <Checkbox id="rememberMe" name="rememberMe" />
            Remember me
          </label>
          <Link
            className="text-sm text-slate-500 dark:text-slate-300"
            href="/auth/request-password-reset"
          >
            Forgot password
          </Link>
        </div>
      )}
      <Button className="mt-2 w-full" type="submit" loading={isLoading}>
        {button}
      </Button>
    </form>
  );
};
