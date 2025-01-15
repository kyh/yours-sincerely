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
import { useMediaQuery } from "@init/ui/utils";
import confetti from "canvas-confetti";
import { addDays, format } from "date-fns";
import { PlusIcon } from "lucide-react";

import type { CreatePostInput } from "@init/api/post/post-schema";
import { api } from "@/trpc/react";

type PostFormProps = {
  placeholder?: string;
  onSuccess?: () => void;
};

export const PostForm = ({ placeholder, onSuccess }: PostFormProps) => {
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
      toast.success("Your love letter has been published");
      form.reset({
        content: "",
        createdBy: variables.createdBy,
      });
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handlePostForm = (formData: CreatePostInput) => {
    if (user?.disabled) return toast.error("Your account has been disabled");

    const duration = 1 * 1000;
    const end = Date.now() + duration;
    (function frame() {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();

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
          render={({ field }) => (
            <FormItem
              className="textarea-grow"
              noStyles
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

export const NewPostButton = ({ placeholder }: PostFormProps) => {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery();

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="icon">
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
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button size="icon">
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
        <section className="p-4">
          <PostForm
            placeholder={placeholder}
            onSuccess={() => setOpen(false)}
          />
        </section>
      </DrawerContent>
    </Drawer>
  );
};
