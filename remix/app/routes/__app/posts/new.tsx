import { useState } from "react";
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
import { authenticator } from "~/lib/auth/server/middleware/auth.server";
import { createPost } from "~/lib/post/server/postService.server";
import {
  getSession,
  commitSession,
} from "~/lib/auth/server/middleware/session.server";
import { createPasswordHash } from "~/lib/auth/server/authService.server";
import { Post } from "~/lib/post/data/postSchema";
import { User } from "~/lib/user/data/userSchema";
import { Dialog } from "~/lib/core/ui/Dialog";
import { Button } from "~/lib/core/ui/Button";
import { Divide } from "~/lib/core/ui/Divide";
import { TextField } from "~/lib/core/ui/FormField";
import { PostForm, getStoredPostAndClear } from "~/lib/post/ui/PostForm";
import { SocialLoginForm } from "~/lib/auth/ui/SocialLoginForm";
import { PrivacyTerms } from "~/lib/about/ui/PrivacyTerms";
import { isIOS } from "~/lib/core/util/platform";

export let meta: MetaFunction = () => {
  return {
    title: "New Post",
    description:
      "An ephemeral anonymous blog to send each other tiny beautiful letters",
  };
};

type LoaderData = {
  user: User | null;
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request);
  const data: LoaderData = {
    user,
  };

  return data;
};

export const action: ActionFunction = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request);
  const formData = await request.formData();
  const { content, createdBy } = Object.fromEntries(formData) as Post;

  const post = await createPost({
    content: content || "",
    user: {
      connectOrCreate: {
        where: {
          id: user?.id || "",
        },
        create: {
          name: createdBy,
          passwordHash: await createPasswordHash(
            Math.random().toString(36).substring(2, 15)
          ),
        },
      },
    },
  });

  // Log user in after creation
  if (!user) {
    const session = await getSession(request);
    session.set(authenticator.sessionKey, post.user);
    const headers = new Headers({ "Set-Cookie": await commitSession(session) });
    return redirect("/", { headers });
  }

  return redirect(`/`);
};

const Page = () => {
  const { user } = useLoaderData<LoaderData>();
  const submit = useSubmit();
  const transition = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(!isIOS());

  const submitPost = (e?: React.FormEvent) => {
    if (!user && !e) return setIsOpen(true);

    let createdBy = user?.name || "Anonymous";

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
        postingAs={user?.name}
        isSubmitting={transition.state === "submitting"}
        onSubmit={submitPost}
      />
      <Dialog
        className="pb-[110px]"
        isOpen={isOpen}
        handleClose={() => setIsOpen(false)}
      >
        <h1 className="text-2xl font-bold mb-4">
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
            className="mt-4 pl-8 pr-8"
            disabled={transition.state === "submitting" || !isChecked}
          >
            Publish
          </Button>
        </Form>
        {isIOS() ? (
          <div className="mt-3 text-left">
            <PrivacyTerms withCheckbox onChecked={(c) => setIsChecked(c)} />
          </div>
        ) : (
          <>
            <Divide bgColor="bg-white">Or continue with</Divide>
            <SocialLoginForm />
          </>
        )}
        <div className="absolute h-[160px] bottom-0 pointer-events-none opacity-10 left-0 right-0 w-full">
          <div
            style={{ backgroundPosition: "-50px -10px" }}
            className="absolute bg-no-repeat bg-cover w-1/2 h-full left-0 bg-[url('/assets/bikini.svg')]"
          />
          <div
            style={{ backgroundPosition: "-35px 40px" }}
            className="absolute bg-no-repeat bg-cover w-1/2 h-full right-0 bg-[url('/assets/zombieing.svg')] scale-x-[-1]"
          />
        </div>
      </Dialog>
    </main>
  );
};

export default Page;
