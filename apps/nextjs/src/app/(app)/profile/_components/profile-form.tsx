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
        className="flex flex-col items-center gap-1"
      >
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
            <FormItem noStyles>
              <FormControl>
                <Input
                  className="text-center"
                  placeholder="Your name"
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
