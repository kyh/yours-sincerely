"use client";

import { useState } from "react";
import { createPostInput } from "@init/api/post/post-schema";
import { POST_EXPIRY_DAYS_AGO } from "@init/api/post/post-utils";
import { Button } from "@init/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@init/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@init/ui/drawer";
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
import { cn, useMediaQuery } from "@init/ui/utils";
import { addDays, format } from "date-fns";
import { PlusIcon } from "lucide-react";

import type { CreatePostInput } from "@init/api/post/post-schema";
import { balloons } from "@/components/animations/balloons";
import { api } from "@/trpc/react";

const postFormKey = "post-form";

type PostFormProps = {
  placeholder?: string;
  submitText?: string;
  parentId?: string;
  onSuccess?: () => void;
  contained?: boolean;
};

export const PostForm = ({
  placeholder,
  submitText = "Publish",
  parentId,
  onSuccess,
  contained,
}: PostFormProps) => {
  const [{ user }] = api.auth.workspace.useSuspenseQuery();

  const form = useForm({
    schema: createPostInput,
    defaultValues: {
      parentId,
      content:
        typeof window !== "undefined"
          ? localStorage.getItem(postFormKey) || ""
          : "",
      createdBy: user?.displayName || "Anonymous",
    },
  });

  const createPost = api.post.createPost.useMutation({
    onSuccess: (_data, variables) => {
      localStorage.removeItem(postFormKey);
      form.reset({
        parentId,
        content: "",
        createdBy: variables.createdBy,
      });
      onSuccess?.();
      setTimeout(() => {
        toast.success("Your love letter has been published");
      }, 500);
      setTimeout(() => {
        balloons().catch(console.error);
      }, 600);
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
        className="flex flex-col gap-2"
        onSubmit={form.handleSubmit(handlePostForm)}
      >
        <FormField
          control={form.control}
          name="content"
          render={({ field: { onBlur, ...field } }) => (
            <FormItem
              className={cn(
                "textarea-grow",
                contained && "max-h-[60dvh] min-h-[25dvh] overflow-y-auto",
              )}
              noStyles
              data-textarea-value={field.value}
            >
              <FormLabel className="sr-only">Post content</FormLabel>
              <FormControl>
                <textarea
                  id="post-input"
                  placeholder={placeholder}
                  onBlur={(e) => {
                    if (e.target.value === "") {
                      localStorage.removeItem(postFormKey);
                    } else {
                      localStorage.setItem(postFormKey, e.target.value);
                    }
                    onBlur();
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
            {submitText}
          </Button>
        </footer>
      </form>
    </Form>
  );
};

export const NewPostButton = ({ placeholder }: PostFormProps) => {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery();

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="icon" className="size-12">
            <PlusIcon />
            <span className="sr-only">New Post</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader className="sr-only">
            <DialogTitle>New Post</DialogTitle>
            <DialogDescription>
              Send your tiny beautiful letters to the world
            </DialogDescription>
          </DialogHeader>
          <PostForm
            placeholder={placeholder}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      onAnimationEnd={(open) => {
        if (open) {
          const textareaEl: HTMLTextAreaElement | null = document.querySelector(
            "#drawer-post-form #post-input",
          );
          if (!textareaEl) return;
          textareaEl.focus();
        }
      }}
      repositionInputs={false}
      handleOnly
    >
      <DrawerTrigger asChild>
        <Button size="icon" className="size-12">
          <PlusIcon />
          <span className="sr-only">New Post</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="sr-only">
          <DrawerTitle>New Post</DrawerTitle>
          <DrawerDescription>
            Send your tiny beautiful letters to the world
          </DrawerDescription>
        </DrawerHeader>
        <section id="drawer-post-form" className="p-4">
          <PostForm
            placeholder={placeholder}
            onSuccess={() => setOpen(false)}
            contained
          />
        </section>
      </DrawerContent>
    </Drawer>
  );
};
