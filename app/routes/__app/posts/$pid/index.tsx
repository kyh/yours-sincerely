import { useRef, useEffect } from "react";
import type { LoaderArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { isAuthenticated } from "~/lib/auth/server/authenticator.server";
import { getPost } from "~/lib/post/server/postService.server";
import type { Post } from "~/lib/post/data/postSchema";
import { PostContent } from "~/lib/post/ui/PostContent";
import { CommentContent } from "~/lib/post/ui/CommentContent";
import { BackButton } from "~/lib/post/ui/BackButton";
import { TextArea } from "~/components/FormField";
import { createMeta } from "~/lib/core/util/meta";

const readingTime = require("reading-time/lib/reading-time");

export let meta: MetaFunction = ({ data }: { data?: { post: Post } }) => {
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

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await isAuthenticated(request);
  const post = await getPost({ id: params.pid }, user);

  return json({
    post,
    user,
  });
};

const Page = () => {
  const { post, user } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (fetcher.type === "done" && fetcher.data.success) {
      ref.current?.reset();
    }
  }, [fetcher]);

  const stats = readingTime(post?.content || "");
  console.log("stats", stats);
  return (
    <main className="flex flex-col gap-5 py-5">
      <header className="flex items-center justify-between">
        <BackButton />
        <p className="text-xs text-slate-500 dark:text-slate-300">
          {stats.text}
        </p>
      </header>
      {post && (
        <>
          <div className="w-full rounded-lg bg-slate-100 p-5 shadow dark:bg-slate-900">
            <PostContent
              post={post}
              asLink={false}
              showComment={false}
              showMore
            />
          </div>
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
                  className="absolute bottom-5 right-5 rounded bg-slate-200 px-3 py-2 text-center text-xs transition hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
                  disabled={fetcher.state !== "idle"}
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
