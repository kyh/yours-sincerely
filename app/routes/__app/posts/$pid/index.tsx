import { useRef, useEffect } from "react";
import { json, LoaderArgs, MetaFunction } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { isAuthenticated } from "~/lib/auth/server/authenticator.server";
import { getPost } from "~/lib/post/server/postService.server";
import { Post } from "~/lib/post/data/postSchema";
import { PostContent } from "~/lib/post/ui/PostContent";
import { CommentContent } from "~/lib/post/ui/CommentContent";
import { TextArea } from "~/lib/core/ui/FormField";
import { createMeta } from "~/lib/core/util/meta";

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

  return (
    <main className="flex flex-col gap-8 py-5">
      {post && (
        <>
          <PostContent
            post={post}
            asLink={false}
            showComment={false}
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
