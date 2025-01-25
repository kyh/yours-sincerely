"use client";

import { updateUserInput } from "@init/api/user/user-schema";
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
import { Label } from "@init/ui/label";
import { toast } from "@init/ui/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@init/ui/tooltip";
import { CircleHelpIcon } from "lucide-react";

import type { UpdateUserInput } from "@init/api/user/user-schema";
import { api } from "@/trpc/react";

export const SettingsForm = () => {
  const [{ user }] = api.auth.workspace.useSuspenseQuery();
  const updateUser = api.user.updateUser.useMutation();
  const requestPasswordReset = api.auth.requestPasswordReset.useMutation();

  const form = useForm({
    schema: updateUserInput,
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
                    <TooltipTrigger>
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
      <div className="space-y-1 rounded-b-md px-3 pb-2.5 pt-2.5 outline outline-1 -outline-offset-1 outline-border">
        <Label>Password</Label>
        <Button
          type="button"
          variant="secondary"
          onClick={handleRequestPasswordReset}
        >
          Request password reset
        </Button>
      </div>
    </div>
  );
};
