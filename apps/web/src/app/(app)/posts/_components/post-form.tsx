"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { POST_EXPIRY_DAYS } from "@repo/contracts/content";
import { createPostInput } from "@repo/contracts/post";
import { resolveDisplayName } from "@repo/contracts/user";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@repo/ui/components/drawer";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/form";
import { toast } from "@repo/ui/components/sonner";
import { cn } from "cn";
import { DESKTOP_QUERY, useMediaQuery } from "@repo/ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { PlusIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import type { CreatePostInput } from "@repo/contracts/post";
import { balloons } from "@/components/animations/balloons";
import { refreshAfterPostCreated } from "@/lib/query-policies";
import { useIdentityScope } from "@/lib/use-identity-scope";
import { useWorkspaceUser } from "@/lib/use-workspace-user";
import { orpc } from "@/orpc/react";
import { postDraftKey } from "./post-draft";

// The post is already published; a failed refetch is not the writer's problem.
const refreshQuietly = async (queryClient: QueryClient) => {
  try {
    await refreshAfterPostCreated(queryClient);
  } catch {
    /* the queries refetch on their own next focus */
  }
};

interface PostFormProps {
  placeholder?: string;
  parentId?: string;
  onSuccess?: () => void;
  contained?: boolean;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}

// The letter textarea is labelled with aria-label, not a <label for>: every copy
// carries the `#post-input` hook id, and the home page keeps a hidden inline
// composer mounted beside the dialog one, so `for` would name the wrong copy.
export const PostForm = ({
  placeholder,
  parentId,
  onSuccess,
  contained,
  textareaRef,
}: PostFormProps) => {
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

  const expiry = addDays(new Date(), POST_EXPIRY_DAYS);

  return (
    <Form {...form}>
      <form
        className={cn("flex flex-col gap-2", contained && "min-h-0")}
        onSubmit={form.handleSubmit(handlePostForm)}
      >
        <FormField
          control={form.control}
          name="content"
          render={({ field: { onBlur, ref, ...field } }) => (
            <FormItem
              className={cn(
                "textarea-grow",
                contained && "max-h-[60dvh] min-h-[25dvh] overflow-y-auto",
              )}
              noStyles
              data-textarea-value={field.value}
            >
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
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button size="icon" className="size-12" />}>
          <PlusIcon />
          <span className="sr-only">New Post</span>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader className="sr-only">
            <DialogTitle>New Post</DialogTitle>
            <DialogDescription>Send your tiny beautiful letters to the world</DialogDescription>
          </DialogHeader>
          <PostForm placeholder={placeholder} onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        // The draft saves on blur, and Chromium fires no blur when the closed sheet
        // unmounts a focused textarea.
        if (!nextOpen) {
          textareaRef.current?.blur();
        }
        setOpen(nextOpen);
      }}
      onOpenChangeComplete={(opened) => {
        if (opened) {
          textareaRef.current?.focus({ preventScroll: true });
        }
      }}
      showSwipeHandle
    >
      <DrawerTrigger render={<Button size="icon" className="size-12" />}>
        <PlusIcon />
        <span className="sr-only">New Post</span>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="sr-only">
          <DrawerTitle>New Post</DrawerTitle>
          <DrawerDescription>Send your tiny beautiful letters to the world</DrawerDescription>
        </DrawerHeader>
        <section className="flex min-h-0 flex-col p-4" data-base-ui-swipe-ignore>
          <PostForm
            placeholder={placeholder}
            onSuccess={() => setOpen(false)}
            textareaRef={textareaRef}
            contained
          />
        </section>
      </DrawerContent>
    </Drawer>
  );
};
