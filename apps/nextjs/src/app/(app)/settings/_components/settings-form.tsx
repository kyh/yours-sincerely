"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserInput } from "@repo/api/user/user-schema";
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
import { Label } from "@repo/ui/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/radio-group";
import { themes, useTheme } from "@repo/ui/theme";
import { toast } from "@repo/ui/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/tooltip";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { CircleHelpIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import type { UpdateUserInput } from "@repo/api/user/user-schema";
import { useTRPC } from "@/trpc/react";

export const SettingsForm = () => {
  const trpc = useTRPC();
  const { theme, setTheme } = useTheme();
  const {
    data: { user },
  } = useSuspenseQuery(trpc.auth.workspace.queryOptions());
  const updateUser = useMutation(trpc.user.updateUser.mutationOptions());
  const requestPasswordReset = useMutation(
    trpc.auth.requestPasswordReset.mutationOptions(),
  );

  const form = useForm({
    resolver: zodResolver(updateUserInput),
    defaultValues: {
      userId: user?.id,
      email: user?.email ?? "",
    },
    mode: "onBlur",
  });

  const onSubmit = (data: UpdateUserInput) => {
    const promise = updateUser.mutateAsync(data);
    toast.promise(promise, {
      loading: "Updating Settings...",
      success: "Settings successfully updated",
      error: "Could not update Settings. Please try again.",
    });
  };

  const handleRequestPasswordReset = () => {
    const promise = requestPasswordReset.mutateAsync({
      email: user?.email ?? "",
    });
    toast.promise(promise, {
      loading: "Requesting password reset...",
      success: "Password reset email sent",
      error: "Could not send password reset email. Please try again.",
    });
  };

  const onChangeTheme = (value: string) => {
    setTheme(value);
  };

  return (
    <div className="-space-y-px">
      <Form {...form}>
        <form onBlur={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="last-of-type:rounded-b-none">
                <FormLabel>
                  Email
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CircleHelpIcon className="size-3" />
                    </TooltipTrigger>
                    <TooltipContent>
                      You will continue to be anonymous, this email is just used
                      for account recovery.
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Your email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
      <div className="outline-border space-y-2 px-3 pt-2.5 pb-2.5 outline -outline-offset-1">
        <Label>Password</Label>
        <Button
          type="button"
          variant="secondary"
          onClick={handleRequestPasswordReset}
        >
          Request password reset
        </Button>
      </div>
      <div className="outline-border space-y-4 rounded-b-md px-3 pt-2.5 pb-2.5 outline -outline-offset-1">
        <Label>Appearance</Label>
        <RadioGroup
          className="grid grid-cols-4 gap-4 md:grid-cols-6"
          onValueChange={onChangeTheme}
          value={theme}
        >
          {themes.map((theme) => (
            <label className="flex flex-col items-center gap-1" key={theme.id}>
              <RadioGroupItem
                id={theme.id}
                value={theme.value}
                className="peer sr-only after:absolute after:inset-0"
              />
              <div
                style={{ background: theme.color }}
                className="border-border peer-data-[state=checked]:border-ring size-10 cursor-pointer rounded-full border shadow-xs transition-colors"
              />
              <span className="peer-data-[state=unchecked]:text-muted-foreground text-center text-xs">
                {theme.label}
              </span>
            </label>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
};
