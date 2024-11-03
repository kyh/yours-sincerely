"use client";

import Image from "next/image";
import { updateUserInput } from "@init/api/user/user-schema";
import { getSupabaseBrowserClient } from "@init/db/supabase-browser-client";
import { Button } from "@init/ui/button";
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

import type { UpdateUserInput, UserMetadata } from "@init/api/user/user-schema";
import type { SupabaseClient } from "@supabase/supabase-js";
import { api } from "@/trpc/react";

export const ProfileForm = () => {
  const client = getSupabaseBrowserClient();
  const [{ user }] = api.auth.me.useSuspenseQuery();
  const updateUser = api.user.updateUser.useMutation();
  const metadata = user?.user_metadata as UserMetadata | undefined;
  const form = useForm({
    schema: updateUserInput,
    defaultValues: {
      id: user?.id ?? "",
      displayName: metadata?.displayName ?? "",
      avatarUrl: metadata?.avatarUrl ?? "",
      defaultTeam: metadata?.defaultTeam ?? "",
    },
  });

  const onSubmit = (data: UpdateUserInput) => {
    const promise = updateUser.mutateAsync(data);
    toast.promise(promise, {
      loading: "Updating profile...",
      success: "Profile successfully updated",
      error: "Could not update profile. Please try again.",
    });
  };

  const onProfileImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    const id = toast.loading("Uploading profile image...");

    if (metadata?.avatarUrl) {
      await removeFileFromPublicUrl(client, metadata.avatarUrl);
    }

    const { data: uploadData, error } = await client.storage
      .from("avatars")
      .upload(`${user.id}/${file.name}`, file, {
        upsert: true,
        cacheControl: "3600",
      });

    if (error) {
      return toast.error("Could not upload profile image. Please try again.", {
        id,
      });
    }

    const publicUrl = getPublicUrl(client, uploadData.path);

    updateUser.mutate(
      {
        id: user.id,
        avatarUrl: publicUrl,
      },
      {
        onSuccess: () => {
          toast.success("Profile image uploaded successfully", { id });
        },
        onError: () => {
          toast.error("Could not update profile image. Please try again.", {
            id,
          });
        },
      },
    );
  };

  const removeProfileImage = async () => {
    if (!metadata?.avatarUrl) return;
    await removeFileFromPublicUrl(client, metadata.avatarUrl);
    updateUser.mutate({
      id: user?.id ?? "",
      avatarUrl: "",
    });
  };

  if (!user) {
    return null;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="col-span-full flex items-center gap-x-8">
          <label className="relative cursor-pointer">
            <input
              className="invisible absolute inset-0"
              type="file"
              onChange={onProfileImageChange}
            />
            {metadata?.avatarUrl ? (
              <Image
                src={metadata.avatarUrl}
                alt="Profile picture"
                className="h-24 w-24 flex-none rounded-lg bg-background object-cover"
                width={96}
                height={96}
              />
            ) : (
              <div className="h-24 w-24 flex-none rounded-lg bg-muted" />
            )}
          </label>
          <div>
            {metadata?.avatarUrl ? (
              <Button variant="secondary" onClick={removeProfileImage}>
                Remove Profile Image
              </Button>
            ) : (
              <Button variant="secondary" asChild>
                <label>
                  <input
                    className="invisible absolute inset-0"
                    type="file"
                    onChange={onProfileImageChange}
                  />
                  Change Profile Image
                </label>
              </Button>
            )}
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              JPG, GIF or PNG. 1MB max.
            </p>
          </div>
        </div>
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormDescription>
                This is the name that will be displayed on your profile and in
                emails.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
          <FormLabel>Email</FormLabel>
          <Input placeholder="Email" value={user.email} disabled />
          <FormDescription>
            Please contact support if you need to change your email address.
          </FormDescription>
        </FormItem>
        <footer className="flex justify-end">
          <Button type="submit" loading={updateUser.isPending}>
            Update Profile
          </Button>
        </footer>
      </form>
    </Form>
  );
};

const removeFileFromPublicUrl = async (
  client: SupabaseClient,
  publicUrl: string,
) => {
  const pathSegments = publicUrl.split("/avatars/");
  const filePath = pathSegments[1];

  if (!filePath) return;

  const { error } = await client.storage.from("avatars").remove([filePath]);
  if (error) console.error("Error deleting file:", error);
};

const getPublicUrl = (client: SupabaseClient, uploadPath: string) => {
  const {
    data: { publicUrl },
  } = client.storage.from("avatars").getPublicUrl(uploadPath);

  return publicUrl;
};
