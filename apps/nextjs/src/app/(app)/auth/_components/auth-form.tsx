"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithPasswordInput } from "@repo/api/auth/auth-schema";
import { Button } from "@repo/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/form";
import { Input } from "@repo/ui/input";
import { toast } from "@repo/ui/toast";
import { cn } from "@repo/ui/utils";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { SignInWithPasswordInput } from "@repo/api/auth/auth-schema";
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
    resolver: zodResolver(signInWithPasswordInput),
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
  const trpc = useTRPC();
  const [isSuccess, setIsSuccess] = useState(false);

  const requestPasswordReset = useMutation(
    trpc.auth.requestPasswordReset.mutationOptions({
      onSuccess: () => {
        setIsSuccess(true);
        toast.success("Password reset email sent successfully!");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const form = useForm({
    resolver: zodResolver(
      z.object({
        email: z.string().email(),
      }),
    ),
    defaultValues: {
      email: "",
    },
  });

  const handlePasswordReset = (data: { email: string }) => {
    requestPasswordReset.mutate(data);
  };

  if (isSuccess) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
          <p className="text-sm text-green-800 dark:text-green-200">
            Password reset email sent! Check your inbox and follow the
            instructions to reset your password.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        className="grid gap-4"
        onSubmit={form.handleSubmit(handlePasswordReset)}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="grid gap-1 space-y-0">
              <FormLabel className="sr-only">Email</FormLabel>
              <FormControl>
                <Input
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
        <Button loading={requestPasswordReset.isPending}>
          Request Password Reset
        </Button>
      </form>
    </Form>
  );
};

export const UpdatePasswordForm = () => {
  const trpc = useTRPC();
  const router = useRouter();

  const updatePassword = useMutation(
    trpc.auth.updatePassword.mutationOptions({
      onSuccess: () => {
        toast.success("Password updated successfully!");
        router.push("/dashboard");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const form = useForm({
    resolver: zodResolver(
      z
        .object({
          password: z.string().min(8, "Password must be at least 8 characters"),
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: "Passwords don't match",
          path: ["confirmPassword"],
        }),
    ),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const handleUpdatePassword = (data: {
    password: string;
    confirmPassword: string;
  }) => {
    updatePassword.mutate({ password: data.password });
  };

  return (
    <Form {...form}>
      <form
        className="grid gap-4"
        onSubmit={form.handleSubmit(handleUpdatePassword)}
      >
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="grid gap-1 space-y-0">
              <FormLabel className="sr-only">New Password</FormLabel>
              <FormControl>
                <Input
                  required
                  type="password"
                  placeholder="Enter new password"
                  autoCapitalize="none"
                  autoComplete="new-password"
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
          name="confirmPassword"
          render={({ field }) => (
            <FormItem className="grid gap-1 space-y-0">
              <FormLabel className="sr-only">Confirm New Password</FormLabel>
              <FormControl>
                <Input
                  required
                  type="password"
                  placeholder="Confirm new password"
                  autoCapitalize="none"
                  autoComplete="new-password"
                  autoCorrect="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button loading={updatePassword.isPending}>Update Password</Button>
      </form>
    </Form>
  );
};

export const MultiFactorAuthForm = () => {
  return null;
};
