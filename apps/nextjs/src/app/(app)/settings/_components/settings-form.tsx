"use client";

import { updateUserInput } from "@init/api/user/user-schema";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from "@init/ui/form";
import { Input } from "@init/ui/input";
import { toast } from "@init/ui/toast";

import type { UpdateUserInput } from "@init/api/user/user-schema";
import { api } from "@/trpc/react";

export const SettingsForm = () => {
  const [{ user }] = api.auth.workspace.useSuspenseQuery();
  const updateUser = api.user.updateUser.useMutation();

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Your email" {...field} />
              </FormControl>
              <FormDescription>
                You will continue to be anonymous, this email is just used for
                account recovery.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};
