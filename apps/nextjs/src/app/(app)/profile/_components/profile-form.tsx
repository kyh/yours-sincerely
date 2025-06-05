"use client";

import { updateUserInput } from "@repo/api/user/user-schema";
import { ProfileAvatar } from "@repo/ui/avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  useForm,
} from "@repo/ui/form";
import { Input } from "@repo/ui/input";
import { toast } from "@repo/ui/toast";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";

import type { UpdateUserInput } from "@repo/api/user/user-schema";
import { getAvatarUrl } from "@/lib/avatars";
import { useTRPC } from "@/trpc/react";

type ProfileFormProps = {
  userId: string;
  readonly?: boolean;
};

export const ProfileForm = ({ userId, readonly }: ProfileFormProps) => {
  const trpc = useTRPC();
  const {
    data: { user },
  } = useSuspenseQuery(trpc.user.getUser.queryOptions({ userId }));
  const updateUser = useMutation(trpc.user.updateUser.mutationOptions());

  const form = useForm({
    schema: updateUserInput,
    defaultValues: {
      userId: user?.id,
      displayName: user?.displayName || "Anonymous",
    },
    mode: "onBlur",
  });

  const onSubmit = (data: UpdateUserInput) => {
    const promise = updateUser.mutateAsync(data);
    toast.promise(promise, {
      loading: "Updating profile...",
      success: "Profile successfully updated",
      error: "Could not update profile. Please try again.",
    });
  };

  return (
    <Form {...form}>
      <form
        onBlur={form.handleSubmit(onSubmit)}
        className="flex flex-col items-center gap-2"
      >
        <ProfileAvatar
          className="size-20"
          src={getAvatarUrl(user?.displayName || user?.id)}
        />
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem noStyles>
              <FormControl>
                <Input
                  className="enabled:hover:bg-accent rounded px-3 py-1 text-center text-xl font-bold transition"
                  placeholder="Your name"
                  disabled={readonly}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};
