import { useRef, useEffect } from "react";
import {
  MetaFunction,
  LoaderFunction,
  ActionFunction,
  redirect,
  json,
  useLoaderData,
  useFetcher,
} from "remix";
import { isAuthenticated } from "~/lib/auth/server/middleware/auth.server";
import { User } from "~/lib/user/data/userSchema";
import { getPost, deletePost } from "~/lib/post/server/postService.server";
import { Post } from "~/lib/post/data/postSchema";
import { PostContent } from "~/lib/post/ui/PostContent";
import { CommentContent } from "~/lib/post/ui/CommentContent";
import { TextArea } from "~/lib/core/ui/FormField";
import { createMeta } from "~/lib/core/util/meta";

export let meta: MetaFunction = ({
  data,
}: {
  data: LoaderData | undefined;
}) => {
  if (!data || !data.post) {
    return createMeta({
      title: "Invalid Post",
      description: "This post does not exist or is under review",
    });
  }
  return createMeta({
    siteTitle: `Yours Sincerely, ${data.post.createdBy}`,
    description: `A lovely letter by ${data.post.createdBy} which will dissapear into the ether in a few days`,
  });
};

type LoaderData = {
  post: Post | null;
  user: User | null;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await isAuthenticated(request);
  const post = await getPost({ id: params.pid }, user);

  const data: LoaderData = {
    post,
    user,
  };

  return data;
};

export const action: ActionFunction = async ({ request, params }) => {
  const user = await isAuthenticated(request);

  const userId = user?.id;
  const postId = params.pid;

  if (!userId || !postId) return json({ success: false }, { status: 400 });

  try {
    if (request.method === "DELETE") {
      await deletePost({ id: postId });
    }

    return redirect("/");
  } catch (error) {
    console.error(error);
    return json({ success: false, error }, { status: 500 });
  }
};

const Page = () => {
  const { post, user } = useLoaderData<LoaderData>();
  const fetcher = useFetcher();
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (fetcher.type === "done" && fetcher.data.success) {
      ref.current?.reset();
    }
  }, [fetcher]);

  return (
    <main className="flex flex-col gap-8 py-5">
      {post && (
        <>
          <PostContent
            post={post}
            showLink={false}
            showTimer={false}
            showMore
          />
          <div className="flex flex-col gap-3">
            {user && (
              <fetcher.Form
                ref={ref}
                className="relative"
                action={`/posts/${post.id}/comment`}
                method="post"
              >
                <TextArea
                  id="comment"
                  name="content"
                  placeholder={`Reply to ${post.createdBy}`}
                  autoFocus
                  required
                />
                <button
                  type="submit"
                  className="absolute px-3 py-2 text-xs text-center transition rounded bg-slate-200 bottom-5 right-5 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
                >
                  Reply
                </button>
              </fetcher.Form>
            )}
            <h1 className="text-sm">Comments ({post.commentCount || 0})</h1>
            {post?.comments && (
              <div className="flex flex-col gap-6">
                {post.comments.map((comment) => (
                  <CommentContent key={comment.id} post={comment} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
      {!post && (
        <p className="text-lg">This post no longer exist or is under review</p>
      )}
    </main>
  );
};

export default Page;
