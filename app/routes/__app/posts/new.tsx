import { useEffect, useState } from "react";
import {
  MetaFunction,
  LoaderFunction,
  ActionFunction,
  redirect,
  useLoaderData,
  useSubmit,
  useTransition,
  Form,
} from "remix";
import {
  isAuthenticated,
  attachUserSession,
} from "~/lib/auth/server/authenticator.server";
import {
  generateToken,
  createPasswordHash,
} from "~/lib/auth/server/authService.server";
import { createPost } from "~/lib/post/server/postService.server";
import { getRandomPrompt } from "~/lib/post/server/promptService.server";
import { updateUser } from "~/lib/user/server/userService.server";
import { createMeta } from "~/lib/core/util/meta";
import { Post } from "~/lib/post/data/postSchema";
import { User } from "~/lib/user/data/userSchema";
import { Dialog } from "~/lib/core/ui/Dialog";
import { Button } from "~/lib/core/ui/Button";
import { Divider } from "~/lib/core/ui/Divider";
import { TextField } from "~/lib/core/ui/FormField";
import { PostForm, getStoredPostAndClear } from "~/lib/post/ui/PostForm";
import { SocialLoginForm } from "~/lib/auth/ui/SocialLoginForm";
import { PrivacyTerms } from "~/lib/about/ui/PrivacyTerms";
import { usePlatform } from "~/lib/core/ui/Platform";

export let meta: MetaFunction = () => {
  return createMeta({
    title: "New Post",
  });
};

type LoaderData = {
  user: User | null;
  promptContent: string;
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await isAuthenticated(request);
  const [prompt] = await getRandomPrompt(1);

  const data: LoaderData = {
    user,
    promptContent: prompt.content,
  };

  return data;
};

export const action: ActionFunction = async ({ request }) => {
  const user = await isAuthenticated(request);
  const formData = await request.formData();
  const { content, createdBy } = Object.fromEntries(formData) as Post;
  const tempPassword = generateToken();

  const post = await createPost({
    content: content || "",
    createdBy,
    user: {
      connectOrCreate: {
        where: {
          id: user?.id || "",
        },
        create: {
          displayName: createdBy,
          passwordHash: await createPasswordHash(tempPassword),
        },
      },
    },
  });

  // Log user in after creation
  if (!user) {
    const headers = await attachUserSession(request, post.user.id);
    return redirect("/", { headers });
  } else {
    await updateUser({ id: user.id, displayName: createdBy });
    return redirect("/");
  }
};

const Page = () => {
  const { isIOS } = usePlatform();
  const { user, promptContent } = useLoaderData<LoaderData>();
  const submit = useSubmit();
  const transition = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(true);
  const [postingAs, setPostingAs] = useState(user?.displayName || "");

  useEffect(() => {
    if (isIOS) setIsChecked(false);
  }, [isIOS]);

  const savePostingAs = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    const input = Object.fromEntries(data.entries()) as {
      createdBy: string;
    };
    setPostingAs(input.createdBy);
    setIsOpen(false);
  };

  const submitPost = () => {
    const { content } = getStoredPostAndClear();
    const submission = { content: content || "", createdBy: postingAs };
    submit(submission, {
      method: "post",
    });
  };

  return (
    <main>
      <PostForm
        postingAs={postingAs}
        placeholder={promptContent}
        isSubmitting={transition.state === "submitting"}
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
        <Form method="post" onSubmit={savePostingAs}>
          <TextField
            id="createdBy"
            name="createdBy"
            label="I'd like to publish as"
            placeholder="Bojack the horse"
            required
          />
          <Button
            type="submit"
            className="pl-8 pr-8 mt-4"
            disabled={transition.state === "submitting" || !isChecked}
          >
            Save and continue
          </Button>
        </Form>
        {isIOS ? (
          <div className="mt-3 text-left">
            <PrivacyTerms withCheckbox onChecked={(c) => setIsChecked(c)} />
          </div>
        ) : (
          <>
            <Divider bgColor="bg-white dark:bg-slate-900">
              Or continue with
            </Divider>
            <SocialLoginForm />
          </>
        )}
        <div className="absolute h-[160px] bottom-0 pointer-events-none opacity-10 left-0 right-0 w-full dark:opacity-90">
          <div
            style={{ backgroundPosition: "-50px -10px" }}
            className="absolute bg-no-repeat bg-cover w-1/2 h-full left-0 bg-[url('/assets/bikini.svg')]"
          />
          <div
            style={{ backgroundPosition: "-35px 40px" }}
            className="absolute bg-no-repeat bg-cover w-1/2 h-full right-0 scale-x-[-1] bg-[url('/assets/zombieing.svg')]"
          />
        </div>
      </Dialog>
    </main>
  );
};

export default Page;
