"use client";

import { createPostInput } from "@init/api/post/post-schema";
import { POST_EXPIRY_DAYS_AGO } from "@init/api/post/post-utils";
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
import { toast } from "@init/ui/toast";
import { addDays, format } from "date-fns";

import type { CreatePostInput } from "@init/api/post/post-schema";
import { api } from "@/trpc/react";

type PostFormProps = {
  placeholder?: string;
};

export const PostForm = ({ placeholder }: PostFormProps) => {
  const [{ user }] = api.auth.workspace.useSuspenseQuery();

  const form = useForm({
    schema: createPostInput,
    defaultValues: {
      content: "",
      createdBy: user?.displayName || "Anonymous",
    },
  });

  const createPost = api.post.createPost.useMutation({
    onSuccess: (_data, variables) => {
      toast.message("Your love letter has been published");
      form.reset({
        content: "",
        createdBy: variables.createdBy,
      });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handlePostForm = (formData: CreatePostInput) => {
    if (user?.disabled) return toast.error("Your account has been disabled");
    createPost.mutate(formData);
  };

  const expiry = addDays(new Date(), POST_EXPIRY_DAYS_AGO);

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-2 border-b border-border pb-5"
        onSubmit={form.handleSubmit(handlePostForm)}
      >
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem
              className="textarea-grow"
              data-textarea-value={field.value}
            >
              <FormLabel className="sr-only">Post content</FormLabel>
              <FormControl>
                <textarea placeholder={placeholder} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <footer className="flex items-center justify-between gap-1">
          <div className="flex flex-col gap-1 text-xs">
            <span className="flex flex-wrap gap-1">
              Publishing as
              <FormField
                control={form.control}
                name="createdBy"
                render={({ field }) => (
                  <FormControl>
                    <input
                      className="-m-1 bg-transparent p-1 underline decoration-dotted underline-offset-2 outline-none hover:cursor-pointer focus-visible:cursor-text"
                      {...field}
                    />
                  </FormControl>
                )}
              />
            </span>
            <span className="text-muted-foreground">
              This post will expire on {format(expiry, "MMMM do")}
            </span>
          </div>
          <Button type="submit" loading={createPost.isPending}>
            Publish
          </Button>
        </footer>
      </form>
    </Form>
  );
};
