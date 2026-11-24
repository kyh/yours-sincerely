"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { POST_EXPIRY_DAYS } from "@repo/contract/post/post-content";
import { resolveDisplayName } from "@repo/contract/user/user-display";
import { createPostInput } from "@repo/contract/post/post-schema";
import { Button } from "@repo/ui/components/button";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogTrigger,
} from "@repo/ui/components/responsive-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/form";
import { toast } from "@repo/ui/components/sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { PlusIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import type { CreatePostInput } from "@repo/contract/post/post-schema";
import { balloons } from "@/components/animations/balloons";
import { refreshAfterPostCreated } from "@/lib/query-policies";
import { useIdentityScope } from "./use-identity-scope";
import { useWorkspaceUser } from "@/lib/use-workspace-user";
import { orpc } from "@/orpc/react";
import { postDraftKey } from "./post-draft";

const letterFieldClass =
  "textarea-grow in-data-[slot=drawer-popup]:max-h-[60dvh] in-data-[slot=drawer-popup]:min-h-[25dvh] in-data-[slot=drawer-popup]:overflow-y-auto";

const refreshQuietly = async (queryClient: QueryClient) => {
  await refreshAfterPostCreated(queryClient).catch(() => null);
};

interface PostFormProps {
  placeholder?: string;
  parentId?: string;
  onSuccess?: () => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export const PostForm = ({ placeholder, parentId, onSuccess, textareaRef }: PostFormProps) => {
  const queryClient = useQueryClient();
  const user = useWorkspaceUser();
  const draftKey = postDraftKey(parentId);

  const form = useForm({
    defaultValues: {
      content: "",
      createdBy: resolveDisplayName(user?.displayName),
      parentId,
    },
    resolver: zodResolver(createPostInput),
  });

  const { getFieldState, resetField } = form;

  useEffect(() => {
    const draft = localStorage.getItem(draftKey);

    if (draft !== null && !getFieldState("content").isDirty) {
      resetField("content", { defaultValue: draft });
    }
  }, [draftKey, getFieldState, resetField]);

  const identityScope = useIdentityScope();

  const createPost = useMutation(
    orpc.post.createPost.mutationOptions({
      onError: (err) => {
        toast.error(err.message);
      },
      onSuccess: (_data, variables) => {
        void refreshQuietly(queryClient);
        localStorage.removeItem(draftKey);
        form.reset({
          content: "",
          createdBy: variables.createdBy,
          parentId,
        });
        onSuccess?.();
        setTimeout(() => {
          toast.success("Your love letter has been published");
        }, 500);
        setTimeout(async () => {
          try {
            await balloons();
          } catch (error) {
            console.error(error);
          }
        }, 600);
      },
      scope: identityScope,
    }),
  );

  const handlePostForm = (formData: CreatePostInput) => {
    if (user?.disabled) {
      return toast.error("Your account has been disabled");
    }

    createPost.mutate(formData);
  };

  // oxlint-disable-next-line react/hook-use-state -- initializer-only state, never set
  const [expiry] = useState(() => addDays(new Date(), POST_EXPIRY_DAYS));

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-2 in-data-[slot=drawer-popup]:min-h-0"
        onSubmit={form.handleSubmit(handlePostForm)}
      >
        <FormField
          control={form.control}
          name="content"
          render={({ field: { onBlur, ref, ...field } }) => (
            <FormItem className={letterFieldClass} noStyles data-textarea-value={field.value}>
              <FormControl>
                <textarea
                  id="post-input"
                  aria-label="Post content"
                  ref={(element) => {
                    ref(element);

                    if (textareaRef) {
                      textareaRef.current = element;
                    }
                  }}
                  placeholder={placeholder}
                  onBlur={(e) => {
                    if (e.target.value === "") {
                      localStorage.removeItem(draftKey);
                    } else {
                      localStorage.setItem(draftKey, e.target.value);
                    }

                    onBlur();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      void form.handleSubmit(handlePostForm)();
                    }
                  }}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <footer className="flex items-center justify-between gap-1">
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex flex-wrap gap-1">
              Publishing as
              <FormField
                control={form.control}
                name="createdBy"
                render={({ field }) => (
                  <FormItem noStyles>
                    <FormLabel className="sr-only">Pen name</FormLabel>
                    <FormControl>
                      <input
                        className="-m-1 bg-transparent p-1 underline decoration-dotted underline-offset-2 outline-hidden hover:cursor-pointer focus-visible:cursor-text"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
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

export const NewPostButton = ({ placeholder }: PostFormProps) => {
  const [open, setOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          textareaRef.current?.blur();
        }

        setOpen(nextOpen);
      }}
      onOpenChangeComplete={(opened) => {
        if (opened) {
          textareaRef.current?.focus();
        }
      }}
    >
      <ResponsiveDialogTrigger render={<Button size="icon" className="size-12" />}>
        <PlusIcon />
        <span className="sr-only">New Post</span>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent
        title="New Post"
        description="Send your tiny beautiful letters to the world"
      >
        <PostForm
          placeholder={placeholder}
          onSuccess={() => setOpen(false)}
          textareaRef={textareaRef}
        />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};
