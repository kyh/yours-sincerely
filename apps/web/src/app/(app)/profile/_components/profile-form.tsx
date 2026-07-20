"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserInput } from "@repo/contracts/user";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/form";
import { Input } from "@repo/ui/components/input";
import { toast } from "@repo/ui/components/sonner";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import type { UpdateUserInput } from "@repo/contracts/user";
import { getAvatarUrl } from "@/lib/avatars";
import { refreshProfileData, refreshWorkspaceIdentity } from "@/lib/query-policies";
import { useTRPC } from "@/trpc/react";

type ProfileFormProps = {
  userId: string;
  readonly?: boolean;
};

export const ProfileForm = ({ userId, readonly }: ProfileFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const {
    data: { user },
  } = useSuspenseQuery(trpc.user.getUser.queryOptions({ userId }));

  // The display name shows on the profile and in the workspace identity.
  const updateUser = useMutation(
    trpc.user.updateUser.mutationOptions({
      onSuccess: () =>
        Promise.all([
          refreshProfileData(queryClient, trpc),
          refreshWorkspaceIdentity(queryClient, trpc),
        ]),
    }),
  );

  const form = useForm({
    resolver: zodResolver(updateUserInput),
    defaultValues: {
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
      <form onBlur={form.handleSubmit(onSubmit)} className="flex flex-col items-center gap-2">
        <ProfileAvatar className="size-20" src={getAvatarUrl(user?.displayName || user?.id)} />
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem noStyles>
              <FormLabel className="sr-only">Display name</FormLabel>
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
