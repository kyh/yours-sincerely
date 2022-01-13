import { Link, LoaderFunction, useLoaderData } from "remix";
import { ClientOnly } from "remix-utils";
import ReactTooltip from "react-tooltip";
import { isAuthenticated } from "~/lib/auth/server/authenticator.server";
import { User } from "~/lib/user/data/userSchema";
import { getPostList } from "~/lib/post/server/postService.server";
import { Post } from "~/lib/post/data/postSchema";
import { PostContent } from "~/lib/post/ui/PostContent";
import { useInfiniteScroll } from "~/lib/core/ui/InfiniteScroll";

type LoaderData = {
  postList: Post[];
  user: User | null;
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await isAuthenticated(request);
  const url = new URL(request.url);
  const cursor = url.searchParams.get("c");
  const postList = await getPostList(user, { cursor });

  const data: LoaderData = {
    postList,
    user,
  };

  return data;
};

const Page = () => {
  const { postList } = useLoaderData<LoaderData>();
  const {
    fetcher,
    hasNextPage,
    ref,
    data: posts,
  } = useInfiniteScroll({
    initialData: postList,
    fetcherResultKey: "postList",
  });

  return (
    <>
      {!!posts.length && (
        <main className="flex flex-col gap-8 py-5">
          {posts.map((post) => (
            <PostContent key={post.id} post={post} />
          ))}
          <ClientOnly>
            <ReactTooltip effect="solid" className="tooltip" />
          </ClientOnly>
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
