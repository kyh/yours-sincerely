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
} from "~/lib/auth/server/middleware/auth.server";
import { createPost } from "~/lib/post/server/postService.server";
import {
  generateToken,
  createPasswordHash,
} from "~/lib/auth/server/authService.server";
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
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await isAuthenticated(request);

  const data: LoaderData = {
    user,
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
  }

  return redirect("/");
};

const Page = () => {
  const { isIOS } = usePlatform();
  const { user } = useLoaderData<LoaderData>();
  const submit = useSubmit();
  const transition = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(true);

  useEffect(() => {
    if (isIOS) setIsChecked(false);
  }, [isIOS]);

  const submitPost = (e?: React.FormEvent) => {
    if (!user && !e) return setIsOpen(true);

    let createdBy = user?.displayName || "Anonymous";

    if (e) {
      e.preventDefault();
      const data = new FormData(e.target as HTMLFormElement);
      const input = Object.fromEntries(data.entries()) as {
        createdBy: string;
      };
      createdBy = input["createdBy"];
    }

    const { content } = getStoredPostAndClear();
    const submission = { content: content || "", createdBy };

    submit(submission, {
      method: "post",
    });
  };

  return (
    <main>
      <PostForm
        postingAs={user?.displayName}
        isSubmitting={transition.state === "submitting"}
        onSubmit={submitPost}
      />
      <Dialog
        className="pb-[110px]"
        isOpen={isOpen}
        handleClose={() => setIsOpen(false)}
      >
        <h1 className="mb-4 text-2xl font-bold">
          Even ghostwriters have names
        </h1>
        <Form method="post" onSubmit={submitPost}>
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
            Publish
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
