import { useEffect } from "react";
import { Link, LoaderFunction, useLoaderData, json } from "remix";
import { getFlash } from "~/lib/core/server/session.server";
import { isAuthenticated } from "~/lib/auth/server/authenticator.server";
import { User } from "~/lib/user/data/userSchema";
import { getPostList } from "~/lib/post/server/postService.server";
import { Post } from "~/lib/post/data/postSchema";
import { PostContent } from "~/lib/post/ui/PostContent";
import { useToast } from "~/lib/core/ui/Toaster";
import { useInfiniteScroll } from "~/lib/core/ui/InfiniteScroll";

type LoaderData = {
  postList: Post[];
  user: User | null;
  message?: string;
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await isAuthenticated(request);
  const url = new URL(request.url);
  const cursor = url.searchParams.get("c");
  const postList = await getPostList(user, { cursor });
  const { message, headers } = await getFlash(request);

  const data: LoaderData = {
    postList,
    user,
    message,
  };

  return json(data, { headers });
};

const Page = () => {
  const { toast } = useToast();
  const { postList, message } = useLoaderData<LoaderData>();
  const {
    fetcher,
    hasNextPage,
    ref,
    data: posts,
  } = useInfiniteScroll({
    initialData: postList,
    fetcherResultKey: "postList",
  });

  useEffect(() => {
    if (message) toast(message);
  }, [message]);

  return (
    <>
      {!!posts.length && (
        <main className="flex flex-col gap-8 py-5">
          {posts.map((post) => (
            <PostContent key={post.id} post={post} />
          ))}
          {fetcher.state === "idle" && hasNextPage && (
            <div className="text-center" ref={ref}>
              Loading...
            </div>
          )}
        </main>
      )}
      {!posts.length && <EmptyPost />}
    </>
  );
};

const EmptyPost = () => (
  <main className="max-w-sm m-auto text-center">
    <h1 className="text-2xl font-bold">
      It's kind of lonely here... could you help{" "}
      <Link to="/posts/new">start something?</Link>
    </h1>
    <img src="/assets/reading.svg" alt="No posts" width={400} height={300} />
  </main>
);

export default Page;
