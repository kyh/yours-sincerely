"use client";

import { updateUserInput } from "@init/api/user/user-schema";
import { Avatar, AvatarFallback, AvatarImage } from "@init/ui/avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  useForm,
} from "@init/ui/form";
import { Input } from "@init/ui/input";
import { toast } from "@init/ui/toast";

import type { UpdateUserInput } from "@init/api/user/user-schema";
import { getAvatarUrl } from "@/lib/avatars";
import { api } from "@/trpc/react";

type ProfileFormProps = {
  userId: string;
  readonly?: boolean;
};

export const ProfileForm = ({ userId }: ProfileFormProps) => {
  const [{ user }] = api.user.getUser.useSuspenseQuery({ userId });
  const updateUser = api.user.updateUser.useMutation();

  const form = useForm({
    schema: updateUserInput,
    defaultValues: {
      userId: user?.id,
      displayName: user?.displayName ?? "",
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Avatar className="size-20">
          <AvatarImage
            className="dark:invert"
            src={getAvatarUrl(user?.displayName || user?.id)}
            alt="Profile image"
          />
          <AvatarFallback>A</AvatarFallback>
        </Avatar>
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};
