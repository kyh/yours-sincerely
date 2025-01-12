"use client";

import { createPostInput } from "@init/api/post/post-schema";
import { Button } from "@init/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  useForm,
} from "@init/ui/form";
import { toast } from "@init/ui/toast";

import type { CreatePostInput } from "@init/api/post/post-schema";
import { api } from "@/trpc/react";

type CommentFormProps = {
  postId: string;
  postCreatedBy?: string;
};

export const CommentForm = ({ postId, postCreatedBy }: CommentFormProps) => {
  const [{ user }] = api.auth.workspace.useSuspenseQuery();

  const createPost = api.post.createPost.useMutation({
    onSuccess: () => {
      toast.message("Your comment has been added");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const form = useForm({
    schema: createPostInput,
    defaultValues: {
      parentId: postId,
      content: "",
      createdBy: user?.displayName || "Anonymous",
    },
  });

  const handlePostForm = (formData: CreatePostInput) => {
    if (user?.disabled) {
      toast.error("Your account has been disabled");
      return;
    }

    createPost.mutate(formData);
  };

  return (
    <Form {...form}>
      <form className="relative" onSubmit={form.handleSubmit(handlePostForm)}>
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem
              className="textarea-grow"
              data-textarea-value={field.value}
            >
              <FormLabel className="sr-only">Comment content</FormLabel>
              <FormControl>
                <textarea
                  placeholder={`Reply to ${postCreatedBy}`}
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button
          className="absolute bottom-5 right-5 rounded px-3 py-2 text-center text-xs transition"
          type="submit"
          loading={createPost.isPending}
        >
          Publish
        </Button>
      </form>
    </Form>
  );
};
