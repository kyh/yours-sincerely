"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { resolveDisplayName, updateUserInput } from "@repo/contracts/user";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/form";
import { Input } from "@repo/ui/components/input";
import { toast } from "@repo/ui/components/sonner";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import type { UpdateUserInput } from "@repo/contracts/user";
import { getAvatarUrl } from "@/lib/avatars";
import { refreshProfileData, refreshWorkspaceIdentity } from "@/lib/query-policies";
import { orpc } from "@/orpc/react";

interface ProfileFormProps {
  userId: string;
  readonly?: boolean;
}

export const ProfileForm = ({ userId, readonly }: ProfileFormProps) => {
  const queryClient = useQueryClient();
  const {
    data: { user },
  } = useSuspenseQuery(orpc.user.getUser.queryOptions({ input: { userId } }));

  // The display name shows on the profile and in the workspace identity.
  const updateUser = useMutation(
    orpc.user.updateUser.mutationOptions({
      onSuccess: () =>
        Promise.all([refreshProfileData(queryClient), refreshWorkspaceIdentity(queryClient)]),
    }),
  );

  const form = useForm({
    defaultValues: {
      displayName: resolveDisplayName(user?.displayName),
    },
    resolver: zodResolver(updateUserInput),
  });

  const onSubmit = (data: UpdateUserInput) => {
    const submitted = form.getValues("displayName");
    const promise = updateUser.mutateAsync(data, {
      // Typing during the save keeps its text, and stays dirty for the next blur.
      onSuccess: () =>
        form.reset(data, { keepValues: form.getValues("displayName") !== submitted }),
    });
    toast.promise(promise, {
      error: "Could not update profile. Please try again.",
      loading: "Updating profile...",
      success: "Profile successfully updated",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col items-center gap-2">
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
                  onBlur={() => {
                    field.onBlur();
                    if (form.getFieldState("displayName").isDirty && !updateUser.isPending) {
                      void form.handleSubmit(onSubmit)();
                    }
                  }}
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
