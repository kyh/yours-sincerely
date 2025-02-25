"use client";

import { useParams, useRouter } from "next/navigation";
import { signInWithPasswordInput } from "@init/api/auth/auth-schema";
import { Button } from "@init/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from "@init/ui/form";
import { Input } from "@init/ui/input";
import { toast } from "@init/ui/toast";
import { cn } from "@init/ui/utils";
import { useMutation } from "@tanstack/react-query";

import type { SignInWithPasswordInput } from "@init/api/auth/auth-schema";
import { useTRPC } from "@/trpc/react";

type AuthFormProps = {
  type: "signin" | "signup";
} & React.HTMLAttributes<HTMLDivElement>;

export const AuthForm = ({ className, type }: AuthFormProps) => {
  const router = useRouter();
  const params = useParams<{ nextPath?: string }>();
  const trpc = useTRPC();

  const signInWithPassword = useMutation(
    trpc.auth.signInWithPassword.mutationOptions({
      onSuccess: () => {
        router.replace(params.nextPath ?? `/`);
      },
      onError: (error) => toast.error(error.message),
    }),
  );
  const signUp = useMutation(
    trpc.auth.signUp.mutationOptions({
      onSuccess: () => {
        router.replace(params.nextPath ?? `/`);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const form = useForm({
    schema: signInWithPasswordInput,
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleAuthWithPassword = (credentials: SignInWithPasswordInput) => {
    if (type === "signup") {
      signUp.mutate(credentials);
    }
    if (type === "signin") {
      signInWithPassword.mutate(credentials);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleAuthWithPassword)}
        className={cn("flex flex-col gap-5", className)}
      >
        <div className="-space-y-px">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    data-test="email-input"
                    required
                    type="email"
                    placeholder="name@example.com"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    data-test="password-input"
                    required
                    type="password"
                    placeholder="******"
                    autoCapitalize="none"
                    autoComplete="current-password"
                    autoCorrect="off"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button loading={signUp.isPending || signInWithPassword.isPending}>
          {type === "signin" ? "Login" : "Sign Up"}
        </Button>
      </form>
    </Form>
  );
};

export const RequestPasswordResetForm = () => {
  return null;
};

export const UpdatePasswordForm = () => {
  return null;
};

export const MultiFactorAuthForm = () => {
  return null;
};
