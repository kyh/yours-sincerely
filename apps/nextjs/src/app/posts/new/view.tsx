"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@init/ui/toast";

import type { Post } from "@/lib/post/data/postschema";
import type { User } from "@/lib/user/data/userSchema";
import { Button } from "@/app/_components/button";
import { Dialog } from "@/app/_components/dialog";
import { Divider } from "@/app/_components/divider";
import { TextField } from "@/app/_components/formfield";
import { SocialLoginForm } from "@/lib/auth/ui/socialloginform";
import { isPostContentValid } from "@/lib/post/data/postschema";
import { getStoredPostAndClear, PostForm } from "@/lib/post/ui/postform";
import { api } from "@/trpc/react";
import { action } from "./action";

type Props = {
  user: User | null;
};

const View = ({ user }: Props) => {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [postingAs, setPostingAs] = useState(user?.displayName ?? "Anonymous");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { mutate } = api.posts.create.useMutation({
    onSuccess: async () => {
      toast("Your love letter has been published");
      setIsSubmitting(false);
      router.push("/");
    },
    onError: async (err) => {
      toast("You got some errors");
      setIsSubmitting(false);
      // router.push("/");
    },
  });

  const savePostingAs = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    const input = Object.fromEntries(data.entries()) as {
      createdBy: string;
    };
    setPostingAs(input.createdBy);
    setIsOpen(false);
  };

  const submitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    await action();
    setIsSubmitting(true);
    const data = new FormData(e.target as HTMLFormElement);
    const { baseLikeCount } = Object.fromEntries(data) as Post;

    const storedContent = getStoredPostAndClear().content;
    const content = storedContent ?? "";
    const createdBy = postingAs;

    if (!isPostContentValid(content)) {
      toast("You'll need to write a bit more than that");
      return;
    }

    if (user && user.disabled) {
      toast("Your account has been disabled");
      return;
    }

    mutate({
      content: content,
      createdBy: createdBy,
      baseLikeCount: Number(baseLikeCount ?? 0),
    });
  };

  return (
    <main>
      <PostForm
        postingAs={postingAs}
        placeholder={"Write about yourself"}
        isSubmitting={isSubmitting}
        onSubmit={submitPost}
        updatePostingAs={() => setIsOpen(true)}
      />
      <Dialog
        className="pb-[110px]"
        isOpen={isOpen}
        handleClose={() => setIsOpen(false)}
      >
        <h1 className="mb-4 text-2xl font-bold">
          Even ghostwriters have names
        </h1>
        <form method="post" onSubmit={savePostingAs}>
          <TextField
            id="createdBy"
            name="createdBy"
            label="I'd like to publish as"
            placeholder="Bojack the horse"
            required
          />
          <Button type="submit" className="mt-4 pl-8 pr-8">
            Save and continue
          </Button>
        </form>

        <Divider bgColor="bg-white dark:bg-slate-900">Or continue with</Divider>
        <SocialLoginForm />

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[160px] w-full opacity-10 dark:opacity-90">
          <div
            style={{ backgroundPosition: "-50px -10px" }}
            className="absolute left-0 h-full w-1/2 bg-[url('/assets/bikini.svg')] bg-cover bg-no-repeat"
          />
          <div
            style={{ backgroundPosition: "-35px 40px" }}
            className="absolute right-0 h-full w-1/2 scale-x-[-1] bg-[url('/assets/zombieing.svg')] bg-cover bg-no-repeat"
          />
        </div>
      </Dialog>
    </main>
  );
};

export default View;
